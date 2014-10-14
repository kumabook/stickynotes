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
const workers        = [];
const sidebarWorkers = [];
const checkChar      = '✔';
const windowUtils    = require('sdk/window/utils');
const sidebar        = require('sdk/ui/sidebar').Sidebar({
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

var jumpingSticky    = null;
var preferenceWindow = null;

stickynotes.DBHelper.createTables();

var detachWorker = function(worker, workers) {
  var index = workers.indexOf(worker);
  if(index != -1) {
    workers.splice(index, 1);
  }
};
pageMod.PageMod({
  include: ['*', 'file://*', 'about:*', 'resource://*'],
  contentScriptFile: [self.data.url('stickynotes.js'),
                      self.data.url('StickyView.js'),
                      self.data.url('page-mod.js')],
  onAttach: function(worker) {
    var stickies = stickynotes.Sticky.fetchByUrl(worker.url);
    worker.port.emit('strings', {
      'sticky.placeholderText': _('sticky.placeholderText')
    });
    worker.port.emit('load-stickies', stickies);
    if (jumpingSticky) {
      worker.port.emit('focus-sticky', jumpingSticky);
      jumpingSticky = null;
    }
    worker.port.on('delete', deleteSticky);
    worker.port.on('save', function(sticky) {
      var _sticky = new stickynotes.Sticky(sticky);
      _sticky.save();
      sidebarWorkers.forEach(function(w) {
        try {
          w.port.emit('save', sticky);
        } catch (e) {
          detachWorker(w, sidebarWorkers);
        }
      });
    });
    worker.port.on('set_tags', function(sticky, tagStrs) {
      var _sticky = new stickynotes.Sticky(sticky);
      sidebarWorkers.forEach(function(w) {
        w.port.emit('delete', _sticky);
      });
      _sticky.setTags(tagStrs);
      sidebarWorkers.forEach(function(w) {
        w.port.emit('add', _sticky);
      });
    });
    worker.port.on('toggle-menu', function(enabled) {
      panel.port.emit('toggle-menu', enabled);
      toggleVisibilityMenuItem.label = (enabled ? checkChar : '') +
        _('stickyToggleMenu.label');
    });

    worker.on('detach', function () {
      try {
        detachWorker(this, workers);
      } catch (e) {
        console.log('Failed to detach: ' + this);
      }
    });
    workers.push(worker);
  }
});

var exportFromMenu = function() {
  console.log('exported');
  var stickies = stickynotes.Sticky.fetchAll();
  exportStickies(stickies, 'all');
}

var exportFromSidebar = function(stickies, name) {
  exportStickies(stickies, name);
};


var exportStickies = function(stickies, name) {
  var pages = stickynotes.Page.fetchAll();
  stickies.forEach(function(s) {
    _pages = pages.filter(function(p) {
      console.log(p.id + ' ' + p.url);
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
    delete s.id
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
  workers.forEach(function(w) {
    try {
      w.port.emit('delete-sticky', sticky);
    } catch (e) {
      detachWorker(w, workers);
    }
  });

  sidebarWorkers.forEach(function(w) {
    try {
      w.port.emit('delete', sticky);
    } catch (e) {
      detachWorker(w, workers);
    }
  });
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
  workers.forEach(function(w) {
    if (w.url == message.url) {
      try {
        w.port.emit('create-sticky', sticky);
      } catch (e) {
        detachWorker(w, workers);
      }
    }
  });
  sidebarWorkers.forEach(function(w) {
    try {
      w.port.emit('add', sticky);
    } catch (e) {
      detachWorker(w, sidebarWorkers);
    }
  });
};


var jump2Sticky = function(sticky, dstUrl) {
  var worker = tabs.activeTab.attach({
    contentScriptFile: self.data.url('jump.js'),
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
  workers.forEach(function(w) {
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
    sidebar.visible = false;
    sidebar.hide();
  } else {
    sidebar.visible = true;
    sidebar.show();
  }
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
  sidebarWorkers.forEach(function(w) {
    try {
      w.port.emit('focus');
    } catch (e) {
      detachWorker(w, sidebarWorkers);
    }
  });
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
      modifiers: ['meta', 'shift']
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
  width:160,
  height:225,
  contentURL: self.data.url('menu.html'),
  contentScriptFile: self.data.url('menu.js'),
  onHide: function () {
    button.state('window', {checked: false});
  }
});
panel.port.on('import-menu', function(stickies) {
  console.log('imported ' + stickies.length + ' stickies.');
  var importedStickies = stickies.map(function(s) {
    var sticky = stickynotes.Sticky.create(s);
    sticky._url = s.url;
    return sticky;
  });

  workers.forEach(function(w) {
    var _stickies = importedStickies.filter(function(s) {
      return w.url == s._url;
    });
    try {
      w.port.emit('import', _stickies);
    } catch (e) {
      detachWorker(w, workers);
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
panel.port.on('preference-menu', showPreference);
panel.port.emit('strings', {
  'stickyImportMenu.label': _('stickyImportMenu.label'),
  'stickyExportMenu.label': _('stickyExportMenu.label'),
  'stickyMenu.label': _('stickyMenu.label'),
  'stickyToggleMenu.label': _('stickyToggleMenu.label'),
  'show_sticky_list.label': _('show_sticky_list.label'),
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
