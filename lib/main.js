const widgets = require('sdk/widget');
const panels = require("sdk/panel");
const tabs = require('sdk/tabs');
const self = require('sdk/self');
const contextMenu = require('sdk/context-menu');
const _ = require('sdk/l10n').get;
const { Hotkey } = require('sdk/hotkeys');
const pageMod = require('sdk/page-mod');
const stickynotes = require('./stickynotes');
const workers = [];
const sidebar = require('sdk/ui/sidebar').Sidebar({
  id: 'stickynotes-sidebar',
  title: 'Stickynotes sidebar',
  url: 'chrome://stickynotes/content/sidebar.xul',
  onShow: function() {
    this.visible = true;
  },
  onHide: function() {
    this.visible = false;
  },
  onAttach: function(sidebarWorker) {
    sidebar.worker = sidebarWorker;
    sidebarWorker.port.on('jump', function(sticky, url) {
      jump2Sticky(sticky, url);
    });
  },
  onDetach: function() {
    sidebar.worker = null;
  }
});

var jumpingSticky = null;

stickynotes.DBHelper.createTables();

var detachWorker = function(worker, workers) {
  var index = workers.indexOf(worker);
  if(index != -1) {
    workers.splice(index, 1);
  }
};
pageMod.PageMod({
  include: '*',
  contentScriptFile: [self.data.url('stickynotes.js'),
                      self.data.url('StickyView.js'),
                      self.data.url('page-mod.js')],
  onAttach: function(worker) {
    var stickies = stickynotes.Sticky.fetchByUrl(worker.url);
    worker.port.emit('load-stickies', stickies);
    if (jumpingSticky) {
      worker.port.emit('focus-sticky', jumpingSticky);
      jumpingSticky = null;
    }
    worker.port.on('delete', function(sticky) {
      var _sticky = new stickynotes.Sticky(sticky);
      _sticky.remove();
      if (sidebar.worker) {
        sidebar.worker.port.emit('delete', sticky);
      }
    });
    worker.port.on('save', function(sticky) {
      var _sticky = new stickynotes.Sticky(sticky);
      _sticky.save();
      if (sidebar.worker) {
        sidebar.worker.port.emit('save', sticky);
      }
    });
    worker.port.on('set_tags', function(sticky, tagStrs) {
      var _sticky = new stickynotes.Sticky(sticky);
      if (sidebar.worker) {
        sidebar.worker.port.emit('delete', _sticky);
      }
      _sticky.setTags(tagStrs);
      if (sidebar.worker) {
        sidebar.worker.port.emit('add', _sticky);
      }
    });

    worker.on('detach', function () {
      detachWorker(this, workers);
    });
    workers.push(worker);
  }
});

var createStickyWithMessage = function (message) {
  workers.forEach(function(w) {
    if (w.url == message.url) {
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
      w.port.emit('create-sticky', sticky);
      if (sidebar.worker) {
        sidebar.worker.port.emit('add', sticky);
      }
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
        worker.port.emit('transition', dstUrl);
      }
    }
  });
};

var toggleVisibilityWithMessage = function (message) {
  workers.forEach(function(w) {
    if (w.url == message.url) {
      var page = stickynotes.Page.fetchByUrl(message.url);
      var stickies = stickynotes.Sticky.fetchByPage(page);
      w.port.emit('toggle-visibility', stickies);
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
    sidebar.hide();
  } else {
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
  if (sidebar.worker) {
    sidebar.worker.port.emit('focus');
  }
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

var createStickyHotKey = Hotkey({
  combo: 'control-shift-c',
  onPress: createStikcy
});

var focusSidebarHotKey = Hotkey({
  combo: 'control-shift-f',
  onPress: focusSidebar
});

var sidebarHotKey = Hotkey({
  combo: 'accel-shift-s',
  onPress: toggleSidebar
});
var toggleVisibilityHotKey = Hotkey({
  combo: 'control-q',
  onPress: toggleVisibility
});

var panel = panels.Panel({
  width:160,
  height:135,
  contentURL: self.data.url('menu.html'),
  contentScriptFile: self.data.url('menu.js')
});
panel.port.on('sidebar-menu', toggleSidebar);
panel.port.on('toggle-menu', toggleVisibility);
panel.port.on('create-menu', createStikcy);

var widget = widgets.Widget({
  id: 'stickynotes-menu',
  label: 'stickynotes',
  contentURL: self.data.url('stickynotes-icon.png'),
  panel: panel
});
