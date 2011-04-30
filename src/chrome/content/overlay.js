/**
 *  @fileOverview main script of StickyNotes
 * 
 * @author Hiroki Kumamoto
 * @version 1.0.0 
 */
var    XHTMLNS = 'http://www.w3.org/1999/xhtml';
var    loaded= 0;
var StickyNotes = {
    x : 0,
    y : 0,
    createSticky: function(opt){
	var sticky = new Sticky(
		{
		    left: StickyNotes.x,  top: StickyNotes.y ,
		    width: 150,  height: 100, 
		    content: "",  color : "yellow", 
		    tag: "" 
		});
	sticky.insert();
	sticky.createDom();
	Sidebar.createSidebarStickyItem(sticky);
	return sticky;
    },
    deleteSticky: function(sticky){
	sticky.delete();
    },
    onload: function() {//新規文書ごと
        window.content.addEventListener("unload",function() {
                                            loaded = 0;
                                        },false);
        var current_page = window.content.document.location.href;
	dump("onload " + current_page + "\n");
        if (loaded != current_page) loaded = current_page;
        else return;
		//window.removeEventListener("DOMContentLoaded", StickyNotes.onload, false);//新規文書ごとに挙がるイベント
	var doc = window.content.document;//表示しているDocumentを取得
	var url = doc.location.href;
	
	var stickies = DAO.getStickiesByUrl(url);//現在表示しているDocument上の付箋
	
	for(var i = 0; i < stickies.length; i++){
	    stickies[i].createDom();
	}
	//-----サイドバーが存在するなら、現在のページの部分の項目を開く---
	//--- サイドバーの表示はside_bar.jsから作成
/*	var event = { notify: function(timer) { 
			  var doc = window.content.document;//表示しているDocumentを取得
			  var url = doc.location.href;

			  if(url == "about:blank") return;
			  var treeitem = Sidebar.getSidebarDoc().getElementById("tree"+url);

			  if (treeitem == null) return;
			  treeitem.setAttribute("open", "true");
		      }
		    };
	
	var timer = Components.classes["@mozilla.org/timer;1"]
	    .createInstance(Components.interfaces.nsITimer);
	
	timer.initWithCallback(
	    event,
	    100,
	    Components.interfaces.nsITimer.TYPE_ONE_SHOT);	 
*/
	doc.addEventListener(
	    "click",//右クリックしたときのマウスの座標を取得しておく
	    function(event) {
		StickyNotes.x = event.clientX + window.content.pageXOffset;
		StickyNotes.y = event.clientY + window.content.pageYOffset;;					 
		dump("x: " + StickyNotes.x + "   y: " + StickyNotes.y + "\n");
	    },
	    false);
    },
	init : function(aPersist){
	    dump("call init\n");
	    window.addEventListener("DOMContentLoaded", StickyNotes.onload, false);//新規文書ごとに挙がるイベント
	    DAO.createTables();
	}
};


window.addEventListener('load', StickyNotes.init, false);  //新規ウィンドウごとに挙がるイベント
Application.console.log("sticky extension loaded");
