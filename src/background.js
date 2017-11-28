/* global browser: false, setTimeout: false, clearTimeout: false */

import idb    from './utils/indexedDB';
import logger from './utils/logger';
import Sticky from './models/Sticky';
import Page   from './models/Page';
import Tag    from './models/Tag';
import config from './config.json';
import api    from './utils/api';

const contentScriptPorts = {};
const sidebarPorts       = {};
let popupPort            = null;
let syncTimer            = null;
const dbName             = config.DATABASE_NAME;
const dbVersion          = 1;

function getPort(name) {
  if (!name) {
    return null;
  }
  if (name.startsWith('content-script')) {
    return contentScriptPorts[name];
  } else if (name === 'popup') {
    return popupPort;
  } else if (name.startsWith('sidebar')) {
    return sidebarPorts[name];
  }
  return null;
}

function getContentScriptPorts() {
  return Object.values(contentScriptPorts);
}

function getSidebarPorts() {
  return Object.values(sidebarPorts);
}

function createStickyOnActiveTab() {
  browser.tabs.query({ currentWindow: true, active: true }).then((tabs) => {
    if (tabs.length > 0) {
      getContentScriptPorts().forEach(p => p.postMessage({
        type:      'create-sticky',
        targetUrl: tabs[0].url,
      }));
    }
  });
}

function toggleStickies() {
  browser.tabs.query({ currentWindow: true, active: true }).then((tabs) => {
    if (tabs.length > 0) {
      getContentScriptPorts().forEach(p => p.postMessage({
        type:      'toggle-visibility',
        targetUrl: tabs[0].url,
      }));
    }
  });
}

function handleContentScriptMessage(msg) {
  logger.info(`handleContentScriptMessage ${JSON.stringify(msg)}`);
  const port = getPort(msg.portName);
  switch (msg.type) {
    case 'load-stickies': {
      const { url } = msg;
      idb.open(dbName)
        .then(db => Sticky.findByUrl(url, db))
        .then((stickies) => {
          getSidebarPorts().concat(port).forEach(p => p.postMessage({
            type: msg.type,
            stickies,
            targetUrl: url,
          }));
        });
      break;
    }
    case 'reload-stickies': {
      const { url } = msg;
      idb.open(dbName)
        .then(db => Sticky.findByUrl(url, db))
        .then((stickies) => {
          port.postMessage({
            type:     'load-stickies',
            stickies,
            targetUrl: url,
          });
        });
      break;
    }
    case 'create-sticky': {
      const { sticky } = msg;
      idb.open(dbName)
        .then(db => Sticky.new(sticky, db))
        .then((newSticky) => {
          getSidebarPorts().concat(port).forEach(p => p.postMessage({
            type:    'created-sticky',
            payload: newSticky,
          }));
        }).catch((e) => {
          logger.error(e);
        });
      break;
    }
    case 'save-sticky': {
      const { sticky } = msg;
      sticky.updated_at = new Date();
      idb.open(dbName)
        .then(db => Sticky.update(sticky, db))
        .then(() => {
          getSidebarPorts().concat(port).forEach(p => p.postMessage({
            type:    'saved-sticky',
            payload: sticky,
          }));
        });
      break;
    }
    case 'set-tags': {
      break;
    }
    case 'delete-sticky': {
      const { sticky } = msg;
      api.isLoggedIn().then((isLoggedIn) => {
        if (isLoggedIn) {
          sticky.state = Sticky.State.Deleted;
          sticky.updated_at = new Date();
          return idb.open(dbName).then(db => Sticky.update(sticky, db));
        }
        return idb.open(dbName).then(db => Sticky.destroy(sticky.id, db));
      }).then(() => {
        getSidebarPorts().concat(port).forEach(p => p.postMessage({
          type:    'deleted-sticky',
          payload: sticky,
        }));
      });
      break;
    }
    default:
      break;
  }
}

function handlePopupMessage(msg) {
  logger.info(`handlePopupMessage ${msg.type} from ${msg.portName}`);
  const port = getPort(msg.portName);
  switch (msg.type) {
    case 'list-menu': {
      const url = 'sidebar/index.html';
      const active = true;
      browser.runtime.getPlatformInfo().then((info) => {
        switch (info.os) {
          case 'android':
            browser.tabs.create({ url, active }).then((tab) => {
              logger.info(tab);
            });
            break;
          default:
            browser.windows.create({ url }).then((windowInfo) => {
              logger.info(windowInfo);
            });
            break;
        }
      });
      break;
    }
    case 'toggle-menu':
      toggleStickies();
      break;
    case 'create-menu':
      createStickyOnActiveTab();
      break;
    case 'login': {
      const { email, password } = msg.payload;
      api.login(email, password)
        .then(u => port.postMessage({ type: 'logged-in', payload: u }))
        .then(() => sync())
        .catch(e => port.postMessage({ type: 'failed-to-login', payload: e }));
      break;
    }
    case 'logout-menu':
      api.logout()
        .then(() => api.setLastSynced(null))
        .then(() => stopSyncTimer())
        .then(() => port.postMessage({ type: 'logged-out' }))
        .catch(e => logger.error(e));
      break;
    case 'clearCache-menu':
      stopSyncTimer();
      idb.open(dbName).then(db => Promise.all([
        Sticky.clear(db),
        Page.clear(db),
        Tag.clear(db),
      ]))
        .then(() => api.setLastSynced(null))
        .then(() => {
          const type = 'cleared-stickies';
          getSidebarPorts().forEach(p => p.postMessage({ type }));
          getContentScriptPorts().forEach(p => p.postMessage({ type }));
        })
        .then(() => api.isLoggedIn())
        .then((isLoggedIn) => {
          if (isLoggedIn) {
            startSyncTimer();
          }
        })
        .catch(e => logger.error(e));
      break;
    case 'signup': {
      const { email, password, passwordConfirmation } = msg.payload;
      api.signup(email, password, passwordConfirmation)
        .then(() => api.login(email, password))
        .then(u => port.postMessage({ type: 'logged-in', payload: u }))
        .then(u => port.postMessage({ type: 'signed-up', payload: u }))
        .then(() => sync())
        .catch(e => port.postMessage({ type: 'failed-to-signup', payload: e }));
      break;
    }
    case 'reset-password':
      browser.tabs.create({ url: api.resetPasswordUrl });
      break;
    default:
      break;
  }
}

function handleSidebarMessage(msg) {
  const port = getPort(msg.portName);
  switch (msg.type) {
    case 'fetch-stickies': {
      idb.open(dbName).then(db => Promise.all([
        Sticky.findAll(db).then(a => a.filter(s => !Sticky.isDeleted(s))),
        Tag.findAll(db),
        Page.findAll(db),
      ])).then(values => port.postMessage({
        type:    'fetched-stickies',
        payload: { stickies: values[0], tags: values[1], pages: values[2] },
      })).catch((e) => {
        port.postMessage({
          type:    'error',
          payload: { message: e.message },
        });
      });
      break;
    }
    case 'jump-to-sticky': {
      const sticky = msg.payload;
      const url    = sticky.page.url;
      browser.tabs.query({ currentWindow: true, active: true }).then((tabs) => {
        if (tabs.length > 0) {
          if (tabs[0].url === url) {
            getContentScriptPorts().forEach(p => p.postMessage({
              type:      'focus-sticky',
              payload:   sticky,
              targetUrl: url,
            }));
            return;
          }
        }
        browser.tabs.create({ url });
      }).catch(() => browser.tabs.create({ url }));
      break;
    }
    default:
      break;
  }
}

function resolveStickies(stickies, db) {
  return Page.findAll(db).then((pages) => {
    stickies.forEach((s) => {
      s.uuid = s.id;
      const stickyPages = pages.filter((p) => {
        return p.id === s.page.id;
      });
      if (stickyPages.length > 0) {
        s.url   = stickyPages[0].url;
        s.title = stickyPages[0].title;
      }
      if (s.tags) {
        s.tags = s.tags.map(t => t.name);
      } else {
        s.tags = [];
      }
      //      delete s.page;
    });
    return stickies;
  });
}

function importStickies(stickies, db) {
  const createdStickies = [];
  const updatedStickies = [];
  return stickies.reduce((p, s) => {
    s = Sticky.normalize(s);
    logger.info(s);
    return p.then(() => Sticky.findById(s.id, db)).then((sticky) => {
      if (sticky) {
        if (!Sticky.isDeleted(s)) {
          const item = Object.assign({}, sticky, s);
          return Sticky.update(item, db)
            .then((v) => {
              logger.trace(`Updated ${v.id}`);
              updatedStickies.push(v);
            })
            .catch(e => logger.error(e));
        }
        return Sticky.destroy(sticky.id, db)
          .then(() => {
            logger.trace(`Removed ${s.id}`);
            updatedStickies.push(sticky);
          });
      }
      if (!Sticky.isDeleted(s)) {
        return Sticky.new(s, db).then((st) => {
          logger.trace(`Created ${s.id}`);
          createdStickies.push(st);
        }).catch((e) => {
          logger.fatal(`Failed to created ${s.id}`);
          logger.error(e);
        });
      }
      logger.trace(`Already removed ${s.id}`);
      return Promise.resolve();
    });
  }, Promise.resolve()).then(() => {
    getContentScriptPorts().forEach((p) => {
      const url = p.name.substring('content-script-'.length);
      p.postMessage({
        type:    'imported-stickies',
        payload: {
          createdStickies: createdStickies.filter(s => url === s.url),
          updatedStickies: updatedStickies.filter(s => url === s.url),
        },
      });
    });
    Promise.all([
      Sticky.findAll(db).then(a => a.filter(s => !Sticky.isDeleted(s))),
      Tag.findAll(db),
      Page.findAll(db),
    ]).then(vals => getSidebarPorts().forEach(p => p.postMessage({
      type:    'fetched-stickies',
      payload: { stickies: vals[0], tags: vals[1], pages: vals[2] },
    })));
  });
}

function startSyncTimer() {
  syncTimer = setTimeout(sync, config.SYNC_INTERVAL);
}

function stopSyncTimer() {
  if (syncTimer !== null) {
    clearTimeout(syncTimer);
    syncTimer = null;
  }
}

function sync() {
  return Promise.all([api.getLastSynced(), idb.open(dbName)]).then(([s, db]) => {
    const since = s || new Date(0);
    return Sticky.findBySince(since, db)
      .then(stickies => resolveStickies(stickies, db))
      .then(stickies => api.createStickies(stickies))
      .then(() => api.fetchStickies(since))
      .then((stickies) => {
        if (stickies) {
          return importStickies(stickies, db);
        }
        return Promise.resolve();
      })
      .then(() => api.setLastSynced(new Date()));
  }).then(() => startSyncTimer())
    .catch((e) => {
      logger.error(e);
      startSyncTimer();
    });
}

browser.runtime.onConnect.addListener((port) => {
  const name = port.name;
  if (name.startsWith('content-script')) {
    contentScriptPorts[port.name] = port;
    port.onDisconnect.addListener(() => {
      delete contentScriptPorts[port.name];
      port.onMessage.removeListener(handleContentScriptMessage);
    });
    port.onMessage.addListener(handleContentScriptMessage);
  } else if (name === 'popup') {
    popupPort = port;
    port.onDisconnect.addListener(() => {
      popupPort = null;
      port.onMessage.removeListener(handlePopupMessage);
    });
    port.onMessage.addListener(handlePopupMessage);
    api.getUser().then(payload => popupPort.postMessage({ type: 'logged-in', payload }));
  } else if (name.startsWith('sidebar')) {
    sidebarPorts[port.name] = port;
    port.onDisconnect.addListener(() => {
      delete sidebarPorts[port.name];
      port.onMessage.removeListener(handleSidebarMessage);
    });
    port.onMessage.addListener(handleSidebarMessage);
  }
});

function setupContextMenus() {
  browser.contextMenus.create({
    id:       'create-sticky',
    title:    'create sticky',
    contexts: ['all'],
  });

  browser.contextMenus.create({
    id:       'toggle-visibility',
    type:     'radio',
    title:    'show/hide stickies',
    contexts: ['all'],
  });

  browser.contextMenus.create({
    id:       'delete-all',
    title:    'delte all stickies on this page',
    contexts: ['all'],
  });

  browser.contextMenus.create({
    id:       'open-sidebar',
    title:    'open sidebar',
    contexts: ['all'],
  });

  browser.contextMenus.onClicked.addListener((info, tab) => {
    const portName = `content-script-${info.pageUrl}`;
    const port     = contentScriptPorts[portName];
    switch (info.menuItemId) {
      case 'create-sticky':
        if (port) {
          port.postMessage({
            type:      'create-sticky',
            targetUrl: info.pageUrl,
            portName,
          });
        }
        break;
      case 'toggle-visibility':
        break;
      case 'delete-all':
        break;
      case 'open-sidebar':
        browser.sidebarAction.open();
        break;
      default:
        break;
    }
  });
}

function setupCommands() {
  browser.commands.onCommand.addListener((command) => {
    switch (command) {
      case 'create_sticky':
        createStickyOnActiveTab();
        break;
      case 'toggle_stickies':
        toggleStickies();
        break;
      default:
        break;
    }
  });
}


function createDB() {
  return idb.upgrade(dbName, dbVersion, db => Promise.all([
    Sticky.createObjectStore(db),
    Page.createObjectStore(db),
    Tag.createObjectStore(db),
  ]));
}

logger.setLevel(config.LOG_LEVEL);
logger.info(`Current log level is ${logger.getLevel()}`);

createDB().then(() => {
  logger.info('Create database');
  return api.isLoggedIn();
}).then((isLoggedIn) => {
  if (isLoggedIn) {
    startSyncTimer();
  }
});

browser.runtime.getPlatformInfo().then((info) => {
  switch (info.os) {
    case 'android':
      break;
    default:
      setupContextMenus();
      setupCommands();
      break;
  }
});
