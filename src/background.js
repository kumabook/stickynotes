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
const legacyPortName     = 'legacy-stickynotes';
const legacyPort         = browser.runtime.connect({ name: legacyPortName });
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

legacyPort.onMessage.addListener((msg) => {
  const { portName, type } = msg;
  const port = getPort(portName);
  if (port) {
    port.postMessage(msg);
  }
  switch (type) {
    case 'migrate':
      migrate(msg.payload);
      break;
    default:
      break;
  }
});

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
          }));
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
    case 'sidebar-menu':
      if (browser.sidebarAction.open) {
        browser.sidebarAction.open();
      }
      break;
    case 'toggle-menu':
      browser.tabs.query({ currentWindow: true, active: true }).then((tabs) => {
        if (tabs.length > 0) {
          getContentScriptPorts().forEach(p => p.postMessage({
            type:      'toggle-visibility',
            targetUrl: tabs[0].url,
          }));
        }
      });
      break;
    case 'create-menu':
      browser.tabs.query({ currentWindow: true, active: true }).then((tabs) => {
        if (tabs.length > 0) {
          getContentScriptPorts().forEach(p => p.postMessage({
            type:      'create-sticky',
            targetUrl: tabs[0].url,
          }));
        }
      });
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
      }));
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
      const stickyPages = pages.filter((p) => {
        logger.info(`${p.id} ${p.url}`);
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
            .then(() => {
              logger.trace(`Updated ${s.id}`);
              updatedStickies.push(sticky);
            })
            .catch(e => logger.error(e));
        }
        return Sticky.destroy(sticky.id, db)
          .then(() => logger.trace(`Removed ${s.id}`));
      }
      if (s.state !== Sticky.State.Deleted) {
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
  if (port === legacyPort) return;
  const name = port.name;
  if (name.startsWith('content-script')) {
    contentScriptPorts[port.name] = port;
    port.onDisconnect.addListener(() => delete contentScriptPorts[port.name]);
    port.onMessage.addListener(handleContentScriptMessage);
    port.onMessage.addListener(msg => legacyPort.postMessage(msg));
  } else if (name === 'popup') {
    popupPort = port;
    port.onDisconnect.addListener(() => {
      popupPort = null;
    });
    port.onMessage.addListener(handlePopupMessage);
    port.onMessage.addListener(msg => legacyPort.postMessage(msg));
    api.getUser().then(payload => popupPort.postMessage({ type: 'logged-in', payload }));
  } else if (name.startsWith('sidebar')) {
    sidebarPorts[port.name] = port;
    port.onDisconnect.addListener(() => delete sidebarPorts[port.name]);
    port.onMessage.addListener(handleSidebarMessage);
    port.onMessage.addListener(msg => legacyPort.postMessage(msg));
  }
});

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
    default:
      break;
  }
});

function createDB() {
  return idb.upgrade(dbName, dbVersion, db => Promise.all([
    Sticky.createObjectStore(db),
    Page.createObjectStore(db),
    Tag.createObjectStore(db),
  ]));
}

function migrate({ stickies, lastSynced, accessToken, user }) {
  logger.info('---------------------------- migration start -----------------');
  if (user) {
    logger.info(`User is ${user.id}`);
    logger.info(`Last synced is ${lastSynced}`);
  } else {
    logger.info('User is not logged in');
  }
  logger.info(`There are ${stickies.length} stickies`);

  Promise.all([
    api.setLastSynced(lastSynced),
    api.setAccessToken(accessToken),
    api.setUser(user),
  ]).then(() => {
    logger.info('----------------- indexedDB migration start -----------------');
  }).then(() => idb.open(dbName))
    .then(db => stickies.map(s => () => Sticky.new(Sticky.normalizeLegacy(s), db))
          .reduce((acc, p) => acc.then(p), Promise.resolve()).then(() => db))
    .then(() => {
      logger.info('----------------- indexedDB migration end ------------------');
    }).catch((e) => {
      logger.fatal('----------------- indexedDB migration fail -----------------');
      logger.error(e);
    });
}

logger.setLevel(config.LOG_LEVEL);
logger.info(`Current log level is ${logger.getLevel()}`);

createDB().then(() => {
  logger.info('Create database');
});
