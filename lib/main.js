const {Cc,Ci}        = require('chrome');
const prompts        = Cc["@mozilla.org/embedcomp/prompt-service;1"].
                         getService(Ci.nsIPromptService);
const toggle         = require('sdk/ui/button/toggle');
const panels         = require("sdk/panel");
const tabs           = require('sdk/tabs');
const self           = require('sdk/self');
const contextMenu    = require('sdk/context-menu');
const _              = require('sdk/l10n').get;
const { Hotkey }     = require('sdk/hotkeys');
const pageMod        = require('sdk/page-mod');
const stickynotes    = require('./stickynotes');
const checkChar      = '✔';
const windowUtils    = require('sdk/window/utils');
const side           = require('sdk/ui/sidebar');
const timers         = require('sdk/timers');
const unload         = require('sdk/system/unload');
const logger         = {
  fatal: function(msg) {},
  error: function(msg) {},
  warn:  function(msg) {},
  info:  function(msg) {},
  debug: function(msg) {},
  trace: function(msg) {}
};

var jumpingSticky    = null;
var preferenceWindow = null;
var contentWorkers = [];
var sidebarWorkers = [];

stickynotes.DBHelper.createTables();

timers.setTimeout(function() {
  logger.trace('attach curent active tab: ' + tabs.activeTab.url);
  tabs.activeTab.attach({
    contentScriptFile: [self.data.url('stickynotes.js'),
                        self.data.url('StickyView.js'),
                        self.data.url('page-mod.js')],
    onAttach: function(window) {
      setupContentWorker(this);
    },
    onError: function(error) {
      logger.trace(error.fileName+":"+error.lineNumber+": "+error);
    }
  });
}, 10);

tabs.on('activate', function (tab) {
  logger.trace('active: ' + tab.url);
  var worker = tab.attach({
    contentScriptFile: [self.data.url('stickynotes.js'),
                        self.data.url('StickyView.js'),
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

var emitAll = function(workers, type, data) {
  var invalidWorkers = [];
  workers.forEach(function(w) {
    try {
      w.port.emit(type, data);
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
    _sticky.save();
    emitAll(sidebarWorkers, 'save', sticky);
  });
  worker.port.on('set_tags', function(sticky, tagStrs) {
    var _sticky = new stickynotes.Sticky(sticky);
    emitAll(sidebarWorkers, 'delete', _sticky);
    _sticky.setTags(tagStrs);
    emitAll(sidebarWorkers,    'add', _sticky);
  });
  worker.port.on('toggle-menu', function(enabled) {
    panel.port.emit('toggle-menu', enabled);
    toggleVisibilityMenuItem.label = (enabled ? checkChar : '') +
      _('stickyToggleMenu.label');
  });
  worker.port.on('reload-stickies', function(url) {
    worker.port.emit('load-stickies',
                     stickynotes.Sticky.fetchByUrl(url));
    if (jumpingSticky) {
      worker.port.emit('focus-sticky', jumpingSticky);
      jumpingSticky = null;
    }
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
  worker.port.emit('load-stickies', stickynotes.Sticky.fetchByUrl(worker.url));
  if (jumpingSticky) {
    worker.port.emit('focus-sticky', jumpingSticky);
    jumpingSticky = null;
  }
  contentWorkers.push(worker);
};

pageMod.PageMod({
  include: ['*', 'file://*', 'about:*', 'resource://*'],
  contentScriptFile: [self.data.url('stickynotes.js'),
                      self.data.url('StickyView.js'),
                      self.data.url('page-mod.js')],
  contentScriptWhen: 'end',
  onAttach: setupContentWorker
});


var exportFromMenu = function() {
  logger.trace('exported');
  var stickies = stickynotes.Sticky.fetchAll();
  exportStickies(stickies, 'all');
}

var exportFromSidebar = function(stickies, name) {
  exportStickies(stickies, name);
};


var exportStickies = function(stickies, name) {
  var pages = stickynotes.Page.fetchAll();
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
  });

  panel.port.emit('export', stickies, name);
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
  _sticky.remove();
  emitAll(contentWorkers, 'delete-sticky', sticky);
  emitAll(sidebarWorkers,        'delete', sticky);
};

var createStickyWithMessage = function (message) {
  var title = message.title;
  if (title == '') {
    title = _('sticky.noTitle');
  }
  var sticky = stickynotes.Sticky.create({
    left: 0, top: 0,
    width: 150, height: 100,
    url: message.url,
    title: title,
    content: '',
    color: 'yellow',
    tags: ''
  });
  var workers = contentWorkers.filter((w) => { return w.url == message.url; });
  emitAll(       workers,'create-sticky', sticky);
  emitAll(sidebarWorkers,          'add', sticky);
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
      var page = stickynotes.Page.fetchByUrl(message.url);
      if (page) {
        var stickies = stickynotes.Sticky.fetchByPage(page);
        w.port.emit('toggle-visibility', stickies);
      }
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
  width:165,
  height:300,
  contentURL: self.data.url('menu.html'),
  contentScriptFile: self.data.url('menu.js'),
  onHide: function () {
    button.state('window', {checked: false});
  }
});
panel.port.on('import-menu', function(stickies) {
  logger.trace('imported ' + stickies.length + ' stickies.');
  var importedStickies = stickies.map(function(s) {
    var sticky = stickynotes.Sticky.create(s);
    sticky._url = s.url;
    return sticky;
  });

  contentWorkers.forEach(function(w) {
    var _stickies = importedStickies.filter(function(s) {
      return w.url == s._url;
    });
    try {
      w.port.emit('import', _stickies);
    } catch (e) {
      logger.trace('error:' + e);
    }
  });

  sidebarWorkers.forEach(function(w) {
    w.port.emit('import', importedStickies);
  });
});
panel.port.on('export-menu', exportFromMenu);
panel.port.on('sidebar-menu', toggleSidebar);
panel.port.on('toggle-menu', toggleVisibility);
panel.port.on('create-menu', createStikcy);
panel.port.on('search-menu', search);
panel.port.on('display-option-menu', displayOption);
panel.port.on('preference-menu', showPreference);
panel.port.emit('strings', {
  'stickyImportMenu.label': _('stickyImportMenu.label'),
  'stickyExportMenu.label': _('stickyExportMenu.label'),
  'stickyMenu.label': _('stickyMenu.label'),
  'stickyToggleMenu.label': _('stickyToggleMenu.label'),
  'show_sticky_list.label': _('show_sticky_list.label'),
  'stickySearchMenu.label': _('stickySearchMenu.label'),
  'stickyDisplayOptionMenu.label': _('stickyDisplayOptionMenu.label'),
  'preferenceMenu.label': _('preferenceMenu.label')
});

var handleToggleButtonChange = function(state) {
  if (state.checked) {
    panel.show({
      position: button
    });
   }
};

var button = toggle.ToggleButton({
  id: 'stickynotes-menu',
  label: 'stickynotes',
  icon: {
    "16": self.data.url('stickynotes-icon-16.png'),
    "32": self.data.url('stickynotes-icon-32.png'),
    "64": self.data.url('stickynotes-icon-64.png')
  },
  onChange: handleToggleButtonChange
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
sidebar.visible      = false;
