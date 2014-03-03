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
      .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
      .getInterface(Components.interfaces.nsIWebNavigation)
      .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
      .rootTreeItem
      .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
      .getInterface(Components.interfaces.nsIDOMWindow);
    mainWindow.addEventListener('click',
                                stickynotes.Sidebar.resizeSidebarHeight,
                                false);
    stickynotes.Sidebar.groupBy();
  };
  stickynotes.Sidebar.resizeSidebarHeight();
  //Sidebar.getSidebarDoc().getElementById("sticky").height;
      window.addEventListener('load', function() { init(); }, false);
  window.addEventListener('unload',
                          function() {
                            stickynotes.Sidebar.destroy(); },
                          false);
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
