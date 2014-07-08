(function() {
  var init = function() {
    var root = document.getElementById('sticky');
    if (root == null) return;
    root.addEventListener('dblclick', function(e) {
      stickynotes.Sidebar.jump();
    }, true);
    root.addEventListener('keydown', function(e) {
      if (e.keyCode == 13 || e.keyCode == 74)//Enter or j  --> Jump
        stickynotes.Sidebar.jump();
    }, true);
    root.addEventListener('keydown', function(e) {
      if (e.keyCode == 68) {// d  --> Delete
        stickynotes.Sidebar.remove();
        stickynotes.Sidebar.focusSidebar();
      }
    },true);
    var mainWindow = window
      .QueryInterface(Ci.nsIInterfaceRequestor)
      .getInterface(Ci.nsIWebNavigation)
      .QueryInterface(Ci.nsIDocShellTreeItem)
      .rootTreeItem
      .QueryInterface(Ci.nsIInterfaceRequestor)
      .getInterface(Ci.nsIDOMWindow);
    mainWindow.addEventListener('click',
                                stickynotes.Sidebar.resizeSidebarHeight,
                                false);
    stickynotes.Sidebar.groupBy();
    var contextMenu = document.getElementById('context-menu');
    contextMenu.addEventListener('popupshowing',
                                 stickynotes.Sidebar.filterContextMenu,
                                 false);
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
    contextMenu.removeEventListener('popupshowing',
                                    stickynotes.Sidebar.filterContextMenu,
                                    false);
    mainWindow
      .removeEventListener('click',
                           stickynotes.Sidebar.resizeSidebarHeight, false);
  };

  stickynotes.Sidebar.resizeSidebarHeight();
  //Sidebar.getSidebarDoc().getElementById("sticky").height;
  window.addEventListener('load', init, false);
  window.addEventListener('unload', destroy, false);
  addon.port.on('focus', function() {
    stickynotes.Sidebar.focusSidebar();
  });
  addon.port.on('add', function(sticky) {
    stickynotes.Sidebar.addSticky(new stickynotes.Sticky(sticky));
  });
  addon.port.on('delete', function(sticky) {
    stickynotes.Sidebar.deleteSticky(new stickynotes.Sticky(sticky));
  });
  addon.port.on('save', function(sticky) {
    stickynotes.Sidebar.updateSticky(new stickynotes.Sticky(sticky));
  });
}) ();
