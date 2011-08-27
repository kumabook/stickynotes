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
        stickynotes.Sidebar.delete();
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
    //サイドバーに付箋の一覧を作成
    stickynotes.Sidebar.groupBy();
  };
  stickynotes.Sidebar.resizeSidebarHeight();
  //Sidebar.getSidebarDoc().getElementById("sticky").height;
      window.addEventListener('load', function() { init(); }, false);
  window.addEventListener('unload',
                          function() {
                            stickynotes.Sidebar.destroy(); },
                          false);
}) ();
