var Sidebar = {
    getSidebarDoc :function(){
	return  window.parent.document.getElementById("sidebar").contentWindow.document;
    },
    createSidebarStickyItem : function(sticky){
	var sidebarDoc = Sidebar.getSidebarDoc();
	var parent = sidebarDoc.getElementById("tree_page_" + sticky.page_id);
	if(parent == null){
	    Sidebar.createSidebarUrlItem(DAO.getPageById(sticky.page_id));
	}
	var treeitem_sticky = document.createElement("treeitem");
	var treerow_sticky = document.createElement("treerow");
	var treecell_id = document.createElement("treecell") ;
	var treecell_text = document.createElement("treecell") ;
	var treecell_x = document.createElement("treecell") ;
	var treecell_y = document.createElement("treecell") ;
	var treecell_width = document.createElement("treecell") ;
	var treecell_height = document.createElement("treecell") ;
	var treecell_url = document.createElement("treecell") ;
	var treecell_title = document.createElement("treecell") ;
	var treecell_color = document.createElement("treecell") ;

	treeitem_sticky.id = "item"+ sticky.id;
	treerow_sticky.id = "treerow"+ sticky.id;
	treecell_id.id = "treecell_id" + sticky.id; 
	treecell_text.id = "treecell_text" + sticky.id; 
	treecell_x.id = "treecell_x" + sticky.id; 
	treecell_y.id = "treecell_y" + sticky.id; 
	treecell_width.id = "treecell_width" + sticky.id; 
	treecell_height.id = "treecell_height" + sticky.id; 
	treecell_url.id = "treecell_url" + sticky.id; 
	treecell_title .id = "treecell_title" + sticky.id; 
	treecell_color.id = "treecell_color" + sticky.id; 
	
	treecell_id.setAttribute("label", sticky.id);
	treecell_title.setAttribute("label", sticky.title);
	treecell_text.setAttribute("label",sticky.content);
	treecell_x.setAttribute("label", sticky.left);
	treecell_y.setAttribute("label", sticky.top);
	treecell_width.setAttribute("label", sticky.width);
	treecell_height.setAttribute("label", sticky.height);
	treecell_url.setAttribute("label", sticky.url);
	treecell_color.setAttribute("label", sticky.color);
	
	treerow_sticky.appendChild(treecell_text);
	treerow_sticky.appendChild(treecell_id);
	treerow_sticky.appendChild(treecell_x);
	treerow_sticky.appendChild(treecell_y);
	treerow_sticky.appendChild(treecell_url);
	treerow_sticky.appendChild(treecell_title);
	treerow_sticky.appendChild(treecell_width);
	treerow_sticky.appendChild(treecell_height);
	treerow_sticky.appendChild(treecell_color);
	treeitem_sticky.appendChild(treerow_sticky);
	sidebarDoc.getElementById("tree_page_" + sticky.page_id).appendChild(treeitem_sticky);
    },
    createSidebarUrlItem : function(page){
	var sidebarDoc = Sidebar.getSidebarDoc();
	var treeitem = sidebarDoc.createElement("treeitem");
	treeitem.setAttribute("id", "treeitem_"+page.id);
	treeitem.setAttribute("container","true");
	if(page.url ==  window.content.document.location.href){//
	    treeitem.setAttribute("open","true");
	}
	else {
	    treeitem.setAttribute("open","false");
	}
	var treerow = document.createElement("treerow");
	var treecell = document.createElement("treecell");
	treecell.setAttribute("label", page.title);
	treerow.appendChild(treecell);
	var treechildren = document.createElement("treechildren");
	treechildren.setAttribute("id", "tree_page_" + page.id);//
	treeitem.appendChild(treerow);
	treeitem.appendChild(treechildren);
	sidebarDoc.getElementById("sticky_tree").appendChild(treeitem);
	return treeitem;
    },
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
	},
    destroy: function() {
	var mainWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
	    .getInterface (Components.interfaces.nsIWebNavigation)
	    .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
	    .rootTreeItem
	    .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
	    .getInterface(Components.interfaces.nsIDOMWindow);
	document.removeEventListener("popupshowing", this, false);
	
	
	mainWindow.removeEventListener("click", Side_bar_sticky.resizeSidebarHeight, false);
    },
	index :  function(){//サイドバーに付箋の一覧を作成
	    var old_tree =  document.getElementById("sticky_tree");//元の付箋サイドバーの内容をクリア
	    var new_tree = document.createElement("treechildren");
	    if(old_tree == null) return;
	    new_tree.setAttribute("id","sticky_tree");
	    document.getElementById("sticky").replaceChild(new_tree,old_tree);

	    var pages = DAO.getPages();
	    for(var i = 0; i < pages.length; i++) {
		var  stickies = DAO.getStickiesByPageId(pages[i].id);
		if(stickies.length > 0){ // treeの行を作成
		    Sidebar.createSidebarUrlItem(pages[i]);	
		}
		for(var j = 0; j < stickies.length; j++) {
			Sidebar.createSidebarStickyItem(stickies[j]);	
		}
	    }
	    if(document.getElementById("sticky_tree").childNodes.length == 0){
		document.getElementById("clipmenu").hidden = true;
		return;
	    }
	},
    getSelectStickyId : function() {//サイドバーで選択されている付箋の情報を取得
	var id;
	var sidebarDoc = Sidebar.getSidebarDoc();
	var tree =  sidebarDoc.getElementById("sticky");
	id = tree.view.getCellText(tree.currentIndex,tree.columns.getNamedColumn('id'));
	return id; 
    },
    handleEvent : function(event) {//サイドバー上で右クリックしたときの動作
	if(document.getElementById("sticky_tree").childNodes.length == 0){
	    document.getElementById("clipmenu").hidden = true;
	    return;
	}
	var sticky = Side_bar_sticky.getSelectStickyId();
	if(sticky == "") {
	    document.getElementById("clipmenu").hidden = true;
	}
	else {
	    document.getElementById("clipmenu").hidden = false;
	}
    },
    delete: function(){
        var sticky = DAO.getStickyById(Sidebar.getSelectStickyId());
        sticky.delete();
	if(document.getElementById("sticky_tree").childNodes.length == 0){
	    document.getElementById("clipmenu").hidden = true;
	    return;
	}
    },
    jump: function(){
	var sticky = DAO.getStickyById(Sidebar.getSelectStickyId());
	sticky.jump();
    },
    focusSidebar : function() {
	var sidebarDoc = Sidebarl.getSidebarDoc();
	var tree =  sidebarDoc.getElementById("sticky");
	tree.focus();
    },
    toggleVisibilityAllStickies : function(){
	var doc = window.content.document;//
	var URL = doc.location.href;	
	var page = DOA.getPageByUrl(URL);
	var stickies = DOA.getStickiesByPageId(page.id);
	for(var i = 0; i < stickies.length; i++){
	    var stickyDom = doc.getElementById("sticky" + stickies[i].id);	
	    if(sticky.style.visibility == "hidden")	
		stickyDom.style.visibility = "visible";
	    else 
		stickyDom.style.visibility = "hidden";
	}
    },
    resizeSidebarHeight : function(){
	var mainWindow = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
	    .getInterface (Components.interfaces.nsIWebNavigation)
	    .QueryInterface(Components.interfaces.nsIDocShellTreeItem)
	    .rootTreeItem
	    .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
	    .getInterface(Components.interfaces.nsIDOMWindow);			
	var doc = window.content.document;
	Sidebar.getSidebarDoc().getElementById("sticky").height = window.innerHeight;
	//Sticky_util.getSidebarDoc().getElementById("sticky").height = mainWindow.document.height - 120;
    } 
};
