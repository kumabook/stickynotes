var Side_bar_sticky =
    {
        init: function() {
            var root = document.getElementById('sticky');
            if (root == null) return;
            document.addEventListener('click', this, true);
            root.addEventListener('dblclick', function(e) {
                Sidebar.jump();
            }, true);
            root.addEventListener('keydown', function(e) {
                if (e.keyCode == 13 || e.keyCode == 74)//Enter or j  --> Jump
                    Sidebar.jump();
            }, true);
            root.addEventListener('keydown', function(e) {
                if (e.keyCode == 68) {// d  --> Delete
                        Sidebar.delete();
                    Sidebar.focusSidebar();
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
                                        Side_bar_sticky.resizeSidebarHeight,
                                        false);
            //サイドバーに付箋の一覧を作成
            Sidebar.groupBy();
        }
    };

Sidebar.resizeSidebarHeight();
//Sidebar.getSidebarDoc().getElementById("sticky").height;
window.addEventListener('load', function() { Side_bar_sticky.init(); }, false);
window.addEventListener('unload', function() { Sidebar.destroy(); }, false);
