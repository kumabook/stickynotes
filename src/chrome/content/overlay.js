var aConsoleService = Components.classes["@mozilla.org/consoleservice;1"].
     getService(Components.interfaces.nsIConsoleService);

aConsoleService.logStringMessage("a logging message");

/**
 *  @fileoverview main script of StickyNotes.
 *
 * @author Hiroki Kumamoto
 * @version 1.0.0
 */

stickynotes.createSticky = function(opt) {
    var sticky = new stickynotes.Sticky(
        {
            left: stickynotes.x, top: stickynotes.y,
            width: 150, height: 100,
            content: '', color: 'yellow',
            tag: ''
        });
    sticky.insert();
    sticky.createDom();
    stickynotes.Sidebar.addSticky(sticky);
    return sticky;
};
stickynotes.deleteSticky = function(sticky) {
    sticky.delete();
};
stickynotes.onload = function() {//新規文書ごと
    window.content.addEventListener('unload', function() {
        stickynotes.loaded = 0;
    },false);
    var current_page = window.content.document.location.href;
    if (stickynotes.loaded != current_page) stickynotes.loaded = current_page;
    else return;
    //window.removeEventListener("DOMContentLoaded", StickyNotes.onload, false);//新規文書ごとに挙がるイベント
    var doc = window.content.document;//表示しているDocumentを取得
    var url = doc.location.href;
    var stickies = stickynotes.DAO.getStickiesByUrl(url);
    //現在表示しているDocument上の付箋
    for (var i = 0; i < stickies.length; i++) {
        stickies[i].createDom();
    }
    doc.addEventListener(
        'click',//右クリックしたときのマウスの座標を取得しておく
        function(event) {
            stickynotes.x = event.clientX + window.content.pageXOffset;
            stickynotes.y = event.clientY + window.content.pageYOffset;
            dump('x: ' + stickyNotes.x + '   y: ' + stickyNotes.y + '\n');
        },
        false);
};
stickynotes.init = function(aPersist) {
    window.addEventListener('DOMContentLoaded',
                            stickynotes.onload, false);//新規文書ごとに挙がるイベント
    stickynotes.DAO.createTables();
};

window.addEventListener('load', stickynotes.init, false);  //新規ウィンドウごとに挙がるイベント
Application.console.log('sticky extension loaded');
