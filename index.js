const {Cc,Ci}        = require('chrome');
const prompts        = Cc["@mozilla.org/embedcomp/prompt-service;1"].
                         getService(Ci.nsIPromptService);
const ToggleMenu     = require('./lib/toggle-menu');
const panels         = require("sdk/panel");
const tabs           = require('sdk/tabs');
const self           = require('sdk/self');
const contextMenu    = require('sdk/context-menu');
const _              = require('sdk/l10n').get;
const { Hotkey }     = require('sdk/hotkeys');
const pageMod        = require('sdk/page-mod');
const stickynotes    = require('./lib/stickynotes');
const checkChar      = '✔';
const windowUtils    = require('sdk/window/utils');
const side           = require('sdk/ui/sidebar');
const timers         = require('sdk/timers');
const unload         = require('sdk/system/unload');
const config         = require('./lib/config');
const ApiClient      = stickynotes.ApiClient;
const logger         = stickynotes.Logger;

if (config.logLevel) {
  logger.setLevel(config.logLevel);
}

var jumpingSticky    = null;
var preferenceWindow = null;
var contentWorkers = [];
var sidebarWorkers = [];

stickynotes.DBHelper.connection().then((_c) => {
  let c = _c;
  return stickynotes.DBHelper.createTables(c).then(() => {
    return stickynotes.DBHelper.migrate(c);
  }).then(() => {
    c.close();
  }, () => {
    logger.error('Migration error' + e);
    c.close();
  });
});

timers.setTimeout(function() {
  logger.trace('attach curent active tab: ' + tabs.activeTab.url);
  tabs.activeTab.attach({
    contentScriptFile: [self.data.url('stickynotes.js'),
                        self.data.url('StickyView.js'),
                        self.data.url('StickyMenu.js'),
                        self.data.url('Dialog.js'),
                        self.data.url('ColorPicker.js'),
                        self.data.url('TagEditor.js'),
                        self.data.url('page-mod.js')],
    onAttach: function(window) {
      setupContentWorker(this);
    },
    onError: function(error) {
      logger.trace(error.fileName+":"+error.lineNumber+": "+error);
    }
  });
}, 1000);

tabs.on('activate', function (tab) {
  logger.trace('active: ' + tab.url);
  var worker = tab.attach({
    contentScriptFile: [self.data.url('stickynotes.js'),
                        self.data.url('StickyView.js'),
                        self.data.url('StickyMenu.js'),
                        self.data.url('Dialog.js'),
                        self.data.url('ColorPicker.js'),
                        self.data.url('TagEditor.js'),
                        self.data.url('page-mod.js')],
    contentScriptWhen: 'end',
    onAttach: function(window) {
      setupContentWorker(this);
    },
    onError: function(error) {
      logger.trace(error.fileName+":"+error.lineNumber+": "+error);
    }
  });
});

unload.when(function(reason) {
  logger.trace('unload:' + reason);
  contentWorkers.forEach(function(w) {
    w.port.emit('detach');
  });
  contentWorkers = [];
  sidebarWorkers = [];
});

var detachWorker = function(worker, workers) {
  var index = workers.indexOf(worker);
  if(index != -1) {
    workers.splice(index, 1);
  }
};

var emitAll = function(workers, type, data, url) {
  var invalidWorkers = [];
  workers.forEach(function(w) {
    try {
      w.port.emit(type, data, url || w.url);
    } catch (e) {
      logger.trace('error:' + e);
      invalidWorkers.push(w);
    }
  });
  invalidWorkers.forEach(function(w) {
    detachWorker(w, workers);
  });
};

var setupContentWorker = function(worker) {
  worker.port.on('delete', deleteSticky);
  worker.port.on('save', function(sticky) {
    var _sticky = new stickynotes.Sticky(sticky);
    _sticky.save().then(() => {
      emitAll(sidebarWorkers, 'save', _sticky);
    });
  });
  worker.port.on('set_tags', function(sticky, tagStrs) {
    var _sticky = new stickynotes.Sticky(sticky);
    emitAll(sidebarWorkers, 'delete', _sticky);
    _sticky.setTags(tagStrs).then((sticky) => {
      emitAll(sidebarWorkers, 'add', sticky);
    });
  });
  worker.port.on('toggle-menu', function(enabled) {
    panel.port.emit('toggle-menu', enabled);
    toggleVisibilityMenuItem.label = (enabled ? checkChar : '') +
      _('stickyToggleMenu.label');
  });
  worker.port.on('reload-stickies', function(url) {
    stickynotes.Sticky.fetchByUrl(url).then((stickies) => {
      worker.port.emit('load-stickies', stickies, url);
      if (jumpingSticky) {
        worker.port.emit('focus-sticky', jumpingSticky);
        jumpingSticky = null;
      }
    });
  });

  worker.on('detach', function (w) {
    try {
      logger.trace('detach ' + this.url);
      detachWorker(this, contentWorkers);
    } catch (e) {
      logger.trace('error:' + e);
      logger.trace('Failed to detach: ' + this);
    }
  });
  worker.port.emit('strings', {
    'sticky.placeholderText': _('sticky.placeholderText')
  });
  stickynotes.Sticky.fetchByUrl(worker.url).then((stickies) => {
    worker.port.emit('load-stickies', stickies, worker.url);
    if (jumpingSticky) {
      worker.port.emit('focus-sticky', jumpingSticky);
      jumpingSticky = null;
    }
  });
  worker.port.emit('load-css', self.data.url("sticky-view.css"));
  contentWorkers.push(worker);
};

pageMod.PageMod({
  include: ['*', 'file://*', 'about:*', 'resource://*'],
  contentScriptFile: [self.data.url('stickynotes.js'),
                      self.data.url('StickyView.js'),
                      self.data.url('StickyMenu.js'),
                      self.data.url('Dialog.js'),
                      self.data.url('ColorPicker.js'),
                      self.data.url('TagEditor.js'),
                      self.data.url('page-mod.js')],
  contentScriptWhen: 'end',
  onAttach: setupContentWorker
});


var exportFromMenu = function() {
  logger.trace('exported');
  stickynotes.Sticky.fetchAll().then((stickies) => {
    exportStickies(stickies, 'all');
  });
};

var exportFromSidebar = function(stickies, name) {
  exportStickies(stickies, name);
};

var resolveStickies = function(stickies) {
  return stickynotes.Page.fetchAll().then((pages) => {
    stickies.forEach(function(s) {
      var _pages = pages.filter(function(p) {
        logger.trace(p.id + ' ' + p.url);
        return p.id == s.page_id;
      });
      if (_pages.length > 0) {
        s.url = _pages[0].url;
        s.title = _pages[0].title;
      }
      if (s.tags) {
        s.tags = s.tags.map(function(t) {
          return t.name;
        });
      } else {
        s.tags = [];
      }
      delete s.page_id;
      delete s.id;
      s.is_deleted = Boolean(s.is_deleted);
    });
    return stickies;
  });
};

var exportStickies = function(stickies, name) {
  resolveStickies(stickies).then((stickies) => {
    panel.port.emit('export', stickies, name);
  });
};

var deleteSticky = function(sticky) {
  if (sticky.content && stickynotes.needConfirmBeforeDelete) {
    var check = {value: true};
    var yes = prompts.confirmCheck(
      windowUtils.getMostRecentBrowserWindow(),
      _('sticky.confirmDeleteTitle'),
      _('sticky.confirmDeleteContent'),
      _('sticky.needConfirmDelete'), check);
    if (!yes) {
      return;
    }
    stickynotes.needConfirmBeforeDelete = check.value;
  }

  var _sticky = new stickynotes.Sticky(sticky);
  if (ApiClient.isLoggedIn()) {
    _sticky.is_deleted = true;
    _sticky.save().then(() => {
      emitAll(contentWorkers, 'delete-sticky', _sticky);
      emitAll(sidebarWorkers,        'delete', _sticky);
    });
  } else {
    _sticky.remove().then(() => {
      emitAll(contentWorkers, 'delete-sticky', _sticky);
      emitAll(sidebarWorkers,        'delete', _sticky);
    });
  }
};

var createStickyWithMessage = function (message) {
  var title = message.title;
  if (title == '') {
    title = _('sticky.noTitle');
  }
  stickynotes.Sticky.create({
    left: 0, top: 0,
    width: 150, height: 100,
    url: message.url,
    title: title,
    content: '',
    color: 'yellow',
    tags: '',
    is_deleted: false
  }).then((sticky) => {
    emitAll(contentWorkers,'create-sticky', sticky, message.url);
    emitAll(sidebarWorkers,          'add', sticky);
  });
};


var jump2Sticky = function(sticky, dstUrl) {
  var worker = tabs.activeTab.attach({
    contentScriptFile: [self.data.url('jump.js')],
    onMessage: function(currentUrl) {
      if (currentUrl === dstUrl) {
        worker.port.emit('focus', sticky);
      } else {
        jumpingSticky = sticky;
      }
    }
  });
};

var toggleVisibilityWithMessage = function (message) {
  contentWorkers.forEach(function(w) {
    if (w.url == message.url) {
      stickynotes.Page.fetchByUrl(message.url).then((page) => {
        if (page) {
          return stickynotes.Sticky.fetchByPage(page);
        } else {
          return Promise.resolve([]);
        }
      }).then((stickies) => {
        w.port.emit('toggle-visibility', stickies);
      });
    }
  });
};

var createStickyMenuItem = contextMenu.Item({
  label: _('stickyMenu.label'),
  context: contextMenu.PageContext(),
  contentScriptFile: self.data.url('context-menu.js'),
  onMessage: createStickyWithMessage
});

// command
var toggleSidebar = function() {
  if (sidebar.visible) {
    hideSidebar();
  } else {
    showSidebar();
  }
};

var showSidebar = function() {
  sidebar.visible = true;
  sidebar.show();
};

var hideSidebar = function() {
  sidebar.visible = false;
  sidebar.hide();
};

var toggleVisibility = function() {
  tabs.activeTab.attach({
    contentScriptFile: self.data.url('page-fetcher.js'),
    onMessage: toggleVisibilityWithMessage
  });
};

var createStikcy = function() {
  tabs.activeTab.attach({
    contentScriptFile: self.data.url('page-fetcher.js'),
    onMessage: createStickyWithMessage
  });
};

var focusSidebar =  function() {
  emitAll(sidebarWorkers, 'focus');
};

var sidebarWaitMilliSec = 200;

var search = function() {
  var delay = sidebar.visible ? 0 : sidebarWaitMilliSec;
  showSidebar();
  timers.setTimeout(function() {
    emitAll(sidebarWorkers, 'search');
  }, delay);
};

var displayOption = function() {
  var delay = sidebar.visible ? 0 : sidebarWaitMilliSec;
  showSidebar();
  timers.setTimeout(function() {
    emitAll(sidebarWorkers, 'display-option');
  }, delay);
};

var showPreference = function() {
  if (preferenceWindow) {
    preferenceWindow.close();
    preferenceWindow = null;
  }

  preferenceWindow = windowUtils.open(
    'chrome://stickynotes/content/preference.xul', {
      name : 'Sticky Notes Preferences',
      features: {
        chrome: true, toolbar: true, resizable: true,
        centerscreen: true, dialog: true
      }
    });
  preferenceWindow.onChangeShortcut = setShortcuts;

  preferenceWindow.shortcuts = shortcuts;
};

var stickyListSidebarMenuItem = contextMenu.Item({
  label: _('show_sticky_list.label'),
  context: contextMenu.PageContext(),
  contentScriptFile: self.data.url('context-menu.js'),
  onMessage: function () {
    toggleSidebar();
  }
});

var toggleVisibilityMenuItem = contextMenu.Item({
  label: _('stickyToggleMenu.label'),
  context: contextMenu.PageContext(),
  contentScriptFile: self.data.url('context-menu.js'),
  onMessage: toggleVisibilityWithMessage
});

var shortcuts = [
  new stickynotes.Shortcut({
    name: 'create-sticky',
    label: _('stickyMenu.label'),
    action: createStikcy,
    default: {
      key: 'c',
      modifiers: ['control', 'shift']
    }
  }),
  new stickynotes.Shortcut({
    name: 'focus-sidebar',
    label: _('stickyFocusMenu.label'),
    action: focusSidebar,
    default: {
      key: 'f',
      modifiers: ['control', 'shift']
    }
  }),
  new stickynotes.Shortcut({
    name: 'toggle-sidebar',
    label: _('show_sticky_list.label'),
    action: toggleSidebar,
    default: {
      key: 's',
      modifiers: ['control', 'shift']
    }
  }),
  new stickynotes.Shortcut({
    name: 'toggle-visibility',
    label: _('stickyToggleMenu.label'),
    action: toggleVisibility,
    default: {
      key: 'q',
      modifiers: ['control']
    }
  }),
  new stickynotes.Shortcut({
    name: 'search',
    label: _('stickySearchMenu.label'),
    action: search,
    default: {
      key: 'l',
      modifiers: ['control', 'shift']
    }
  }),
  new stickynotes.Shortcut({
    name: 'displayOption',
    label: _('stickyDisplayOptionMenu.label'),
    action: displayOption,
    default: {
      key: 'o',
      modifiers: ['control', 'shift']
    }
  }),
  new stickynotes.Shortcut({
    name: 'show-preference',
    label: _('preferenceMenu.label'),
    action: showPreference,
    default: {
      key: '.',
      modifiers: ['control', 'shift']
    }
  })
];

var panel = panels.Panel({
  width: 170,
  height: 304,
  contentURL: self.data.url('menu.html'),
  contentScriptFile: self.data.url('menu.js'),
  onHide: function () {
    toggleMenu.hide();
  }
});

var importStickies = function(stickies) {
  logger.trace('import ' + stickies.length + ' stickies.');
  var createdStickies = [];
  var updatedStickies = [];
  let sticky;
  stickies.reduce((p, s) => {
    return p.then(() => {
      return stickynotes.Sticky.fetchByUUID(s.uuid);
    }).then((_sticky) => {
      sticky = _sticky;
      if (sticky) {
        updatedStickies.push(sticky);
        if (!s.is_deleted) {
          return sticky.update(s)
            .then(() => sticky.save())
            .then(() => sticky.setTags(s.tags))
            .then(() => {
              logger.trace('Updated ' + sticky.uuid);
            });
        } else {
          return sticky.remove().then(() => {
            logger.trace('Removed ' + sticky.uuid);
          });
          }
      } else {
        if (!s.is_deleted) {
          return stickynotes.Sticky.create(s).then((sticky) => {
            logger.trace('Created ' + sticky.uuid);
            createdStickies.push(sticky);
          }).catch((e) => {
            logger.trace('Failed to created ' + sticky.uuid);
          });
        } else {
          logger.trace('already removed ' + s.uuid);
          return Promise.resolve();
        }
      }
    });
  }, Promise.resolve()).then(() => {
    contentWorkers.forEach(function(w) {
      w.port.emit('import',
                  createdStickies.filter((s) => w.url == s.getPage().url),
                  updatedStickies.filter((s) => w.url == s.getPage().url));
    });
  });

  sidebarWorkers.forEach(function(w) {
    w.port.emit('import', createdStickies, updatedStickies);
  });
};

var syncTimer = null;
var sync = function() {
  // push new stickies
  logger.trace('----------new stickies -----------');
  var lastSynced = stickynotes.lastSynced;
  stickynotes.Sticky.fetchUpdatedStickiesSince(lastSynced).then((stickies) => {
    return resolveStickies(stickies);
  }).then((stickies) => {
    return ApiClient.createStickies(stickies);
  }).then(function() {
    return ApiClient.fetchStickies(lastSynced);
  }).then(function(stickies) {
    logger.trace('----------- fetch stickies --------');
    if (stickies) {
      importStickies(stickies.map(function(s) {
        s.id = null;
        return s;
      }));
    }
    stickynotes.lastSynced = new Date();
    startSyncTimer();
  }, function(error) {
    startSyncTimer();
  });
};

var startSyncTimer = function() {
  if (syncTimer !== null) {
    timers.clearTimeout(syncTimer);
  }
  syncTimer = timers.setTimeout(sync, config.syncInterval);
};

var login = function(name, password) {
  ApiClient.login(name, password).then(function(user) {
    updatePanel();
    sync();
  }, function(error) {
    updatePanel();
  });
};

var logout = function() {
  ApiClient.logout();
  stickynotes.lastSynced = null;
  updatePanel();
};

panel.port.on('import-menu', importStickies);
panel.port.on('export-menu', exportFromMenu);
panel.port.on('sidebar-menu', toggleSidebar);
panel.port.on('toggle-menu', toggleVisibility);
panel.port.on('create-menu', createStikcy);
panel.port.on('search-menu', search);
panel.port.on('display-option-menu', displayOption);
panel.port.on('sync-menu', sync);
panel.port.on('login-menu', login);
panel.port.on('logout-menu', logout);
panel.port.on('preference-menu', showPreference);
panel.port.on('signup', function() {
  tabs.open(ApiClient.signUpUrl);
});
panel.port.on('reset-password', function() {
  tabs.open(ApiClient.resetPasswordUrl);
});

var updatePanel = function() {
  panel.port.emit('update', {
  strings: {
    'stickyImportMenu.label': _('stickyImportMenu.label'),
    'stickyExportMenu.label': _('stickyExportMenu.label'),
    'stickyMenu.label': _('stickyMenu.label'),
    'stickyToggleMenu.label': _('stickyToggleMenu.label'),
    'show_sticky_list.label': _('show_sticky_list.label'),
    'stickySearchMenu.label': _('stickySearchMenu.label'),
    'stickyDisplayOptionMenu.label': _('stickyDisplayOptionMenu.label'),
    'preferenceMenu.label': _('preferenceMenu.label')
  },
    isLoggedIn: ApiClient.isLoggedIn()
  });
};

updatePanel();

var toggleMenu = new ToggleMenu({
  panel: panel,
  onChange: function(state) {
    if (state.checked) {
      panel.show({
        position: toggleMenu.button
      });
    }
  }
});


var setShortcuts = function() {
  shortcuts.forEach(function(shortcut) {
    if (shortcut.hotkey != null) {
      shortcut.hotkey.destroy();
    }
    shortcut.hotkey = Hotkey({
      combo: shortcut.combo,
      onPress: shortcut.action
    });
  });
};

setShortcuts();

var sidebar = side.Sidebar({
  id: 'stickynotes-sidebar',
  title: _('sticky_list.sidebarTitle'),
  url: 'chrome://stickynotes/content/sidebar.xul',
  onShow: function(worker) {
    panel.port.emit('sidebar-menu', true);
    stickyListSidebarMenuItem.label = checkChar + _('show_sticky_list.label');
  },
  onHide: function(worker) {
    panel.port.emit('sidebar-menu', false);
    stickyListSidebarMenuItem.label = _('show_sticky_list.label');
  },
  onAttach: function(worker) {
    sidebarWorkers.push(worker);
    worker.port.on('export', exportFromSidebar);
    worker.port.on('delete', deleteSticky);
    worker.port.on('jump', jump2Sticky);
  },
  onDetach: function(worker) {
    detachWorker(worker, sidebarWorkers);
  }
});
sidebar.visible = false;

if (ApiClient.isLoggedIn()) {
  sync();
}
