 function Sticky(opt) {
     this.id = opt.id ? opt.id : Math.round(Math.random() * 10000);
     var doc = window.content.document;//表示しているDocumentを取得
     if (opt.page_id) {//すでに作成済みの付箋。
         this.page_id = opt.page_id;
         this.page = DAO.getPageById(this.page_id);
         this.url = this.page.url;
         this.title = this.page.title;
     }
     else {//新規作成なので、ページテーブルを作成する必要があるか判定
         this.url = (opt.url != null) ? opt.url : doc.location.href;
         this.title = (opt.url != null) ? opt.url : doc.title;
         if (this.title == '')
             this.title = 'タイトルなし';
         this.page = DAO.getPageByUrl(this.url);
         if (!this.page) {
             this.page_id = Math.round(Math.random() * 10000);
             DAO.insertPage({
                 id: this.page_id,
                 url: this.url,
                 title: this.title
             });
         }
         else {
             this.page_id = this.page.id;
         }
     }
     this.left = opt.left;
     this.top = opt.top;
     this.width = opt.width;
     this.height = opt.height;
     this.content = opt.content;
     if (this.content == '')
         this.content = 'ここにメモを挿入';
     this.color = opt.color;
     this.tag = opt.tag;
     //     this.createDom();
     dump('store sticky\n');
     //     this.addStickySidebar();
 }


Sticky.prototype.insert = function() {
    DAO.insertSticky(this);
};

Sticky.changeElemSize = 35,
Sticky.prototype.update = function() {
    DAO.updateSticky(this);
    this.updateStickySidebar();
};

Sticky.prototype.delete = function() {
    //delete from database
    DAO.deleteSticky(this);
    //delete from sidebar
    this.deleteStickySidebar();
    //delete from content document
    this.deleteDom();
};

Sticky.prototype.updateDom = function() {
    var doc = window.content.document;
    var stickyDom = doc.getElementById('sticky' + this.id);
        if (stickyDom) {
            //	stickyDom;
        }
};
Sticky.prototype.deleteDom = function() {
    var doc = window.content.document;
    var stickyDom = doc.getElementById('sticky' + this.id);
    if (stickyDom) {
        doc.body.removeChild(stickyDom);
    }
};
Sticky.prototype.createDom = function() {
    var doc = window.content.document;//表示しているDocumentを取得
    /*    if(doc.body == null)
          {
          var that = this;//付箋作成を遅延する
          Application.console.log("付箋作成を遅延する");
          setTimeout(1000, function(){
          this.createDom();
          });
          return;
          }*/
    dump('create DomElement of StickyID: ' + this.id + '\n');
    //-- 付箋全体を包含するdiv要素--
    this.dom = doc.createElement('div');
    this.dom.id = 'sticky' + this.id;
    this.dom.style.position = 'absolute';
    this.dom.style.left = this.left + 'px';
    this.dom.style.top = this.top + 'px';
    /*    this.dom.style.width = this.width + "px";
          this.dom.style.height = this.height + "px";
          this.dom.style.backgroundColor = this.color;
          this.dom.style.margin = "0px";
          this.dom.style.opacity = ".75";*/
    //sticky.style.border = "3px outset gray";
    this.dom.style.zIndex = '100';
    this.dom.className = 'sticky';
    //-- テキストを保持するinput要素--
    this.textarea = doc.createElement('textarea');
    this.textarea.style.position = 'relative';
    this.textarea.style.width = this.width + 'px';
    this.textarea.style.height = this.height - 7 + 'px';
    this.textarea.value = this.content;
    this.textarea.style.fontWeight = 'bold';
    this.textarea.id = 'sticky_id_' + this.id;
    this.textarea.style.border = 'none';
    this.textarea.style.margin = '0px';
    this.textarea.style.backgroundColor = this.color;
    //textarea.style.opacity= "1.5";
    this.textarea.style.overflow = 'auto';
    this.textarea.className = 'textArea';
    this.textarea.sticky = this;
    this.textarea.addEventListener('keydown', function(e) {
        if (e.keyCode == 68 && e.ctrlKey && e.shiftKey) {
            e.target.sticky.delete();
        }
    },false);
    //--ドラッグ用のバー--
    this.drag_bar = doc.createElement('div');
    this.drag_bar.style.position = 'relative';
    this.drag_bar.style.width = this.width - 10 + 'px';
    this.drag_bar.style.height = '22px';
    this.drag_bar.style.borderBottom = 'inset';
    this.drag_bar.style.margin = '0px';
    this.drag_bar.className = 'drag_bar';
    this.drag_bar.style.backgroundColor = this.color;
    //--削除ボタン--
    this.delete_button = doc.createElement('div');
    this.delete_button.style.position = 'absolute';
    this.delete_button.style.width = '10px';
    this.delete_button.style.fontFamily = 'fantasy';
    this.delete_button.style.height = '22px';
    this.delete_button.style.left = this.width - 10 + 'px';
    this.delete_button.style.top = '0px';
    this.delete_button.className = 'delete_button';
    this.delete_button.style.backgroundColor = this.color;
    this.delete_button.style.margin = '0px';
    this.delete_button.style.padding = '0px';
    this.delete_button.style.textAlign = 'start';
    this.delete_button.style.borderBottom = 'inset';
    this.delete_button.style.color = 'black';
    this.delete_button.innerHTML = 'x';
    //--付箋全体の大きさを変化させる要素
    this.change_size = doc.createElement('div');
    this.change_size.style.position = 'absolute';
    this.change_size.style.left = this.width - 5 + 'px';
    this.change_size.style.top = this.height + 6 + 'px';
    this.change_size.style.width = '20px';
    this.change_size.style.height = '20px';
    this.change_size.className = 'change_size';
    this.change_size.style.fontSize = '70%';
    this.change_size.style.fontFamily = 'san-serif';
    this.change_size.innerHTML = '';
    this.change_size.style.padding = '0px';
    this.change_size.style.margin = '0px';
    this.change_size.style.textAlign = 'start';
    //--生成したdomを組み立てる
    this.dom.appendChild(this.drag_bar);
    this.dom.appendChild(this.delete_button);
    this.dom.appendChild(this.textarea);
    this.dom.appendChild(this.change_size);
    doc.body.appendChild(this.dom);
    var that = this;
    this.drag_bar.addEventListener('mousedown',
                                   function(e) {
                                       that.drag(this.parentNode, e);
                                   },
                                   true);
    this.delete_button.addEventListener('click',
                                        function(e) {
                                            that.delete();
                                            // doc.body.removeChild(sticky);
                                            e.stopPropagation();
                                        },
                                        true);
    this.textarea.addEventListener('blur',
                                   function(e) {
                                       if (that.content != that.textarea.value) {
                                           that.content = that.textarea.value;
                                           that.update();
                                       }
                                   },
                                   true);
    function getElementPosition(elem) {
        var position = elem.getBoundingClientRect();
        return {
            left: Math.round(window.scrollX + position.left),
            top: Math.round(window.scrollY + position.top)
        };
        }
    //    this.change_size.addEventListener("mousedown",
    this.textarea.addEventListener(
        'mousedown',
        function(e) {
            var pos = getElementPosition(that.textarea);
            var right = pos.left + parseInt(that.textarea.style.width);
            var bottom = pos.top + parseInt(that.textarea.style.height);
            if ((right - Sticky.changeElemSize < e.clientX &&
                 e.clientX < right) &&
                (bottom - Sticky.changeElemSize < e.clientY &&
                 e.clientY < bottom)) {
                that.changeSize(that.dom, e);
            }
        },
        true);
};

Sticky.prototype.drag = function(elem, e) {
    var that = this;
        var URL = window.content.document.location.href;
    var startX = e.clientX, startY = e.clientY;
        var origX = elem.offsetLeft, origY = elem.offsetTop;
    var deltaX = startX - origX, deltaY = startY - origY;
    document.addEventListener('mousemove', moveHandler, true);
    document.addEventListener('mouseup', upHandler, true);
    e.stopPropagation();
    e.preventDefault();
    function moveHandler(e) {
        elem.style.left = (e.clientX - deltaX) + 'px';
        elem.style.top = (e.clientY - deltaY) + 'px';
        e.stopPropagation();
    }
    function upHandler(e) {
        document.removeEventListener('mouseup', upHandler, true);
        document.removeEventListener('mousemove', moveHandler, true);
        that.left = parseInt(elem.style.left);//位置の更新を記録
        that.top = parseInt(elem.style.top);
        that.update();
        e.stopPropagation();
    }
};

Sticky.prototype.changeSize = function(elem, e) {
    var that = this;
    var URL = window.content.document.location.href;
    var origX = elem.offsetLeft, origY = elem.offsetTop;
    var deltaX = startX - origX, deltaY = startY - origY;
    var startX = e.clientX, startY = e.clientY;
    var origWidth = parseInt(that.textarea.style.width),
        origHeight = parseInt(that.textarea.style.height);
    var deltaWidth = startX - origWidth, deltaHeight = startY - origHeight;
    document.addEventListener('mousemove', moveHandler, true);
    document.addEventListener('mouseup', upHandler, true);
    e.stopPropagation();
    e.preventDefault();
    function moveHandler(e) {
        that.textarea.style.width = e.clientX - deltaWidth + 'px';
        that.textarea.style.height = e.clientY - deltaHeight + 'px';
        var width = that.textarea.style.width;
        var height = that.textarea.style.height;
        that.drag_bar.style.width = parseInt(width) + 'px';//drag_bar width
        that.delete_button.style.left = parseInt(width) - 10 + 'px';//delete_button
        //        that.textarea.style.width = parseInt(width)  + "px";//text area size
        //        that.textarea.style.height = parseInt(height) - 7 + "px";
        // elem.lastChild.style.left = parseInt(width) - 5 + "px";//change_button position
        //        elem.lastChild.style.top =  parseInt(height) + 6 + "px";
        e.stopPropagation();
    }
    function upHandler(e) {
        document.removeEventListener('mouseup', upHandler, true);
        document.removeEventListener('mousemove', moveHandler, true);
        that.width = parseInt(that.textarea.style.width);//サイズの更新を記録
        that.height = parseInt(that.textarea.style.height) + 7;
        that.update();
        e.stopPropagation();
    }
};

Sticky.prototype.addStickySidebar = function() {
        var sidebarDoc = Sidebar.getSidebarDoc();
    var url_tree = sidebarDoc.getElementById('tree' + this.url);
    var item = sidebarDoc.getElementById('item' + this.id);
    var url_item = sidebarDoc.getElementById('tree_page_' + this.page_id);
    if (!url_item) {
        url_item = Sidebar.createSidebarUrlItem(
            { id: this.id, url: this.url, title: this.title });
    }
    Sidebar.createSidebarStickyItem(this);
};
Sticky.prototype.deleteStickySidebar = function() {
    var sidebarDoc = Sidebar.getSidebarDoc();
    //    var url_tree = sidebarDoc.getElementById("tree"+this.url);
        varurl_tree = sidebarDoc.getElementById('treeitem_' + this.page_id);
    if (url_tree == null) return;
    var sticky_tree = sidebarDoc.getElementById('sticky_tree');
    var item = sidebarDoc.getElementById('item' + this.id);
        var url_item = sidebarDoc.getElementById('tree_page_' + this.page_id);
    url_item.removeChild(item);
    if (url_item.childNodes.length == 0) {
        sticky_tree.removeChild(url_tree);
    }
};
Sticky.prototype.updateStickySidebar = function() {
    var sidebarDoc = Sidebar.getSidebarDoc();
    var item = sidebarDoc.getElementById('item' + this.id);
    var url_item = sidebarDoc.getElementById(this.url);
    var treecell_id = sidebarDoc.getElementById('treecell_id' + this.id);
    var treecell_text = sidebarDoc.getElementById('treecell_text' + this.id);
    var treecell_x = sidebarDoc.getElementById('treecell_x' + this.id);
    var treecell_y = sidebarDoc.getElementById('treecell_y' + this.id);
    var treecell_width = sidebarDoc.getElementById('treecell_width' + this.id);
    var treecell_height = sidebarDoc.getElementById('treecell_height' + this.id);
    var treecell_url = sidebarDoc.getElementById('treecell_url' + this.id);
    var treecell_title = sidebarDoc.getElementById('treecell_title' + this.id);
    var treecell_color = sidebarDoc.getElementById('treecell_color' + this.id);
    treecell_id.setAttribute('label', this.id);
    treecell_title.setAttribute('label', this.title);
    treecell_text.setAttribute('label', this.content);
    treecell_x.setAttribute('label', this.left);
    treecell_y.setAttribute('label', this.top);
    treecell_width.setAttribute('label', this.width);
    treecell_height.setAttribute('label', this.height);
    treecell_url.setAttribute('label', this.url);
    treecell_color.setAttribute('label', this.color);
};

Sticky.prototype.focus = function() {
    this.textarea.focus();
};

Sticky.prototype.jump = function() {
    if (this.url == '') return;
    if (this.url == window.content.document.location.href)
        window.parent.content.document
        .getElementById('sticky_id_' + this.id).focus();
    else {
        window.content.document.location.href = this.url;
        var that = this;
        var focus_sticky = function(e) {
            window.parent
                .removeEventListener('DOMContentLoaded', focus_sticky, false);
            window.parent.content
                .scrollTo(that.left - window.parent.content.innerWidth / 2 ,
                          that.top - window.parent.content.innerHeight / 3);
            var event = { notify: function(timer) {
                window.parent.content.document
                    .getElementById('sticky_id_' + that.id).focus();
            }
                        };
            var timer = Components.classes['@mozilla.org/timer;1']
                .createInstance(Components.interfaces.nsITimer);
            timer.initWithCallback(
                event,
                200,
                Components.interfaces.nsITimer.TYPE_ONE_SHOT);
        };
        window.parent.addEventListener('DOMContentLoaded',
                                       focus_sticky,
                                       false);
    }
};

Sticky.prototype.toString = function() {
    return 'sticky:' + this.id + ', ' + this.page_id + ', ' +
        this.left + ', ' + this.top + ', ' + this.width + ', ' +
        this.height + ', ' + this.content + ', ' + this.color +
        ', ' + this.tag;
};

Sticky.toggleVisibilityAllStickies = function() {
    var doc = window.content.document;//
    var URL = doc.location.href;
    var page = DAO.getPageByUrl(URL);
    var stickies = DAO.getStickiesByPageId(page.id);
    for (var i = 0; i < stickies.length; i++) {
        var stickyDom = doc.getElementById('sticky' + stickies[i].id);
        if (stickyDom.style.visibility == 'hidden')
            stickyDom.style.visibility = 'visible';
        else
            stickyDom.style.visibility = 'hidden';
    }
};
