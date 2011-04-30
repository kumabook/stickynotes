var Side_bar_sticky = 
    {
	    init : function() {
		var root = document.getElementById("sticky");
		if(root == null) return;
		document.addEventListener("click", this, true);
		root.addEventListener('dblclick', function(e) { 
					  Sidebar.jump();	
				      }, true);
		root.addEventListener('keydown', function(e) {
					  if(e.keyCode == 13 || e.keyCode == 74 )//Enter or j  --> Jump
					      Sidebar.jump();	
				      }, true);
		root.addEventListener('keydown', function(e) {
					  if(e.keyCode == 68 ){// d  --> Delete
					      Sidebar.delete();
					      Sidebar.focusSidebar();
					  }
				      },true);
		var mainWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
		    .getInterface (Components.interfaces.nsIWebNavigation)
		    .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
		    .rootTreeItem
		    .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
		    .getInterface(Components.interfaces.nsIDOMWindow);
		
		mainWindow.addEventListener("click", Side_bar_sticky.resizeSidebarHeight, false);

		//サイドバーに付箋の一覧を作成
		var old_tree =  document.getElementById("sticky_tree");//元の付箋サイドバーの内容をクリア
		var new_tree = document.createElement("treechildren");
		if(old_tree == null) return;
		new_tree.setAttribute("id","sticky_tree");
		document.getElementById("sticky").replaceChild(new_tree,old_tree);
		
		var pages = DAO.getPages();
		var stickies ;
		var i;
		for( i = 0; i < pages.length; i++) {
		    stickies = DAO.getStickiesByPageId(pages[i].id);
/*		    if(stickies.length > 0){ // treeの行を作成
			Sidebar.createSidebarUrlItem(pages[i]);
		    }*/
		    for(var j = 0; j < stickies.length; j++) {
			Sidebar.createSidebarStickyItem(stickies[j]);
		    }
		}
		if(document.getElementById("sticky_tree").childNodes.length == 0){
		    document.getElementById("clipmenu").hidden = true;
		    return;
		}
	    }
    };

//Side_bar_sticky.index();
Sidebar.resizeSidebarHeight();
//Sidebar.getSidebarDoc().getElementById("sticky").height;
window.addEventListener("load", function() { Side_bar_sticky.init(); }, false);
window.addEventListener("unload", function() { Sidebar.destroy(); }, false);
