(function(Cc, Ci) {
  const logger  = stickynotes.Logger;
  const Sidebar = stickynotes.Sidebar;
  const resizeSidebarHeight = Sidebar.resizeSidebarHeight.bind(Sidebar);
  const filterContextMenu   = Sidebar.filterContextMenu.bind(Sidebar);
  if (stickynotes.config.logLevel) {
    logger.setLevel(stickynotes.config.logLevel);
  }
  var init = function() {
    var root = document.getElementById('sticky');
    if (root == null) return;
    root.addEventListener('dblclick', function(e) {
      Sidebar.jump();
    }, true);
    root.addEventListener('keydown', function(e) {
      if (e.keyCode == 13 || e.keyCode == 74)//Enter or j  --> Jump
        Sidebar.jump();
    }, true);
    root.addEventListener('keydown', function(e) {
      if (e.keyCode == 68) {// d  --> Delete
        Sidebar.remove();
        Sidebar.focusSidebar();
      }
    },true);
    window.addEventListener('resize', resizeSidebarHeight, false);
    stickynotes.Sidebar.groupBy();
    var contextMenu = document.getElementById('context-menu');
    contextMenu.addEventListener('popupshowing', filterContextMenu, false);
  };
  var destroy = function() {
    var mainWindow =
      window
      .QueryInterface(Ci.nsIInterfaceRequestor)
      .getInterface(Ci.nsIWebNavigation)
      .QueryInterface(Ci.nsIDocShellTreeItem)
      .rootTreeItem
      .QueryInterface(Ci.nsIInterfaceRequestor)
      .getInterface(Ci.nsIDOMWindow);
    var contextMenu = document.getElementById('context-menu');
    contextMenu.removeEventListener('popupshowing', filterContextMenu, false);
    mainWindow.removeEventListener('click', resizeSidebarHeight, false);
  };
  stickynotes.Sidebar.resizeSidebarHeight();
  window.addEventListener('load', init, false);
  window.addEventListener('unload', destroy, false);
  if (!addon) {
    window.close();
    return;
  }
  addon.port.on('focus', function() {
    stickynotes.Sidebar.focusSidebar();
  });
  addon.port.on('add', function(sticky) {
    stickynotes.Sticky.fetchByUUID(sticky.uuid).then((sticky) => {
      return sticky.fetchPage();
    }).then((sticky) => {
      stickynotes.Sidebar.addSticky(sticky);
    });
  });
  addon.port.on('delete', function(sticky) {
    stickynotes.Sidebar.deleteSticky(new stickynotes.Sticky(sticky));
  });
  addon.port.on('save', function(sticky) {
    stickynotes.Sidebar.updateSticky(new stickynotes.Sticky(sticky));
  });
  addon.port.on('import', function(createdStickies, updatedStickies) {
    createdStickies.forEach(function(s) {
      stickynotes.Sidebar.addSticky(new stickynotes.Sticky(s));
    });
    updatedStickies.forEach(function(s) {
      if (s.is_deleted) {
        stickynotes.Sidebar.deleteSticky(new stickynotes.Sticky(s));
      } else {
        stickynotes.Sidebar.updateSticky(new stickynotes.Sticky(s));
      }
    });
  });
  addon.port.on('search', function() {
    stickynotes.Sidebar.focusSearchBox();
  });
  addon.port.on('display-option', function() {
    stickynotes.Sidebar.openDisplayOptionMenu();
  });
})(stickynotes.Cc, stickynotes.Ci);
