/**
   @constructor
   @param {Object} param param.
*/
stickynotes.Sticky = function(param) {
     this.id = param.id ? param.id : Math.round(Math.random() * 10000);
     var doc = window.content.document;//表示しているDocumentを取得
     if (param.page_id) {//すでに作成済みの付箋。
         this.page_id = param.page_id;
         this.page = stickynotes.DAO.getPageById(this.page_id);
         this.url = this.page.url;
         this.title = this.page.title;
     }
     else {//新規作成なので、ページテーブルを作成する必要があるか判定
         this.url = (param.url != null) ? param.url : doc.location.href;
         this.title = (param.url != null) ? param.url : doc.title;
         if (this.title == '')
             this.title = 'タイトルなし';
         this.page = stickynotes.DAO.getPageByUrl(this.url);
         if (!this.page) {
             this.page_id = Math.round(Math.random() * 10000);
             stickynotes.DAO.insertPage({
                 id: this.page_id,
                 url: this.url,
                 title: this.title
             });
         }
         else {
             this.page_id = this.page.id;
         }
     }
     this.left = param.left;
     this.top = param.top;
     this.width = param.width;
     this.height = param.height;
     this.content = param.content;
     if (this.content == '')
         this.content = 'ここにメモを挿入';
     this.color = param.color;
     dump('store sticky\n');
};

/**
   stikcyを新規に保存
 */
stickynotes.Sticky.prototype.insert = function() {
    stickynotes.DAO.insertSticky(this);
};
/**
   大きさかえるDOM要素のサイズ
 */
stickynotes.Sticky.changeElemSize = 35,
/**
   stikcyをを更新
*/
stickynotes.Sticky.prototype.update = function() {
    stickynotes.DAO.updateSticky(this);
    var tag;
    stickynotes.DAO.deleteRelationStickyAndTag(this);
    for (var i = 0; i < this.tag.length; i++) {
        tag = stickynotes.DAO.getTagByName(this.tag[i]);
        if (tag == null) {
            tag = {id: Math.round(Math.random() * 10000),
                   name: this.tag[i]};
            stickynotes.DAO.insertTag(tag);
        }
        stickynotes.DAO.insertRelationStickyAndTag(this, tag);
    }
    this.updateStickySidebar();
};
/**
   stikcyを削除
 */
stickynotes.Sticky.prototype.remove = function() {
    //delete from database
    stickynotes.DAO.deleteSticky(this);
    //delete from sidebar
    this.deleteStickySidebar();
    //delete from content document
    this.deleteDom();
};
/**
   stikcyのDOM要素を更新
*/
stickynotes.Sticky.prototype.updateDom = function() {
    var doc = window.content.document;
    var stickyDom = doc.getElementById('sticky' + this.id);
        if (stickyDom) {
            //	stickyDom;
        }
};
/**
   stikcyのDOM要素を削除
*/
stickynotes.Sticky.prototype.deleteDom = function() {
    var doc = window.content.document;
    var stickyDom = doc.getElementById('sticky' + this.id);
    if (stickyDom) {
        doc.body.removeChild(stickyDom);
    }
};
/**
   stikcyのDOM要素を作成
*/
stickynotes.Sticky.prototype.createDom = function() {
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
    var that = this;
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
            e.target.sticky.remove();
        }
    },false);
    //--ドラッグ用のバー--
    this.dragBar = doc.createElement('div');
    this.dragBar.style.position = 'relative';
    this.dragBar.style.width = this.width - 10 + 'px';
    this.dragBar.style.height = '22px';
    this.dragBar.style.borderBottom = 'inset';
    this.dragBar.style.margin = '0px';
    this.dragBar.className = 'dragBar';
    this.dragBar.style.backgroundColor = this.color;
    //タグ用のテキストボックス
    this.tagBox = doc.createElement('input');
    this.tagBox.style.position = 'absolute';
    this.tagBox.style.width = '50px';
    this.tagBox.style.right = 30 + 'px';
    this.tagBox.style.top = '0px';
    this.tagBox.value = this.tag ? this.tag.join(',') : '';
    this.tagBox.addEventListener('change', function() {
        var array = (that.tagBox.value + ',').split(',');
        that.tag = array.slice(0, array.length - 1);
        that.update();
    }, false);
    //--削除ボタン--
    this.deleteButton = doc.createElement('div');
    this.deleteButton.style.position = 'absolute';
    this.deleteButton.style.width = '10px';
    this.deleteButton.style.fontFamily = 'fantasy';
    this.deleteButton.style.height = '22px';
    this.deleteButton.style.right = 0 + 'px';
    this.deleteButton.style.top = '0px';
    this.deleteButton.className = 'deleteButton';
    this.deleteButton.style.backgroundColor = this.color;
    this.deleteButton.style.margin = '0px';
    this.deleteButton.style.padding = '0px';
    this.deleteButton.style.textAlign = 'start';
    this.deleteButton.style.borderBottom = 'inset';
    this.deleteButton.style.color = 'black';
    this.deleteButton.innerHTML = 'x';
    //--付箋全体の大きさを変化させる要素
    this.changeSize = doc.createElement('div');
    this.changeSize.style.position = 'absolute';
    this.changeSize.style.left = this.width - 5 + 'px';
    this.changeSize.style.top = this.height + 6 + 'px';
    this.changeSize.style.width = '20px';
    this.changeSize.style.height = '20px';
    this.changeSize.className = 'changeSize';
    this.changeSize.style.fontSize = '70%';
    this.changeSize.style.fontFamily = 'san-serif';
    this.changeSize.innerHTML = '';
    this.changeSize.style.padding = '0px';
    this.changeSize.style.margin = '0px';
    this.changeSize.style.textAlign = 'start';
    //--生成したdomを組み立てる
    this.dom.appendChild(this.dragBar);
    this.dom.appendChild(this.deleteButton);
    this.dom.appendChild(this.textarea);
    this.dom.appendChild(this.changeSize);
    this.dom.appendChild(this.tagBox);
    doc.body.appendChild(this.dom);

    this.dragBar.addEventListener('mousedown',
                                   function(e) {
                                       that.drag(this.parentNode, e);
                                   },
                                   true);
    this.deleteButton.addEventListener('click',
                                        function(e) {
                                            that.remove();
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
    //    this.changeSize.addEventListener("mousedown",
    this.textarea.addEventListener(
        'mousedown',
        function(e) {
            var pos = getElementPosition(that.textarea);
            var right = pos.left + parseInt(that.textarea.style.width);
            var bottom = pos.top + parseInt(that.textarea.style.height);
            if ((right - stickynotes.Sticky.changeElemSize < e.clientX &&
                 e.clientX < right) &&
                (bottom - stickynotes.Sticky.changeElemSize < e.clientY &&
                 e.clientY < bottom)) {
                that.resize(that.dom, e);
            }
        },
        true);
};
/**
   stikcyのDOM要素をドラッグ可能にする.
   @param {Object} elem DOM要素.
   @param {e} e event.
*/
stickynotes.Sticky.prototype.drag = function(elem, e) {
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
/**
   stikcyのDOM要素をリサイズ可能にする.
*/
stickynotes.Sticky.prototype.resize = function(elem, e) {
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
        var width = e.clientX - deltaWidth;
        var height = e.clientY - deltaHeight;
        if (width < 100 || height < 30) return;
        that.textarea.style.width = width + 'px';
        that.textarea.style.height = height + 'px';
        that.dragBar.style.width = parseInt(width) + 'px';//dragBar width
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
/**
   stikcyをサイドバーに追加.
*/
stickynotes.Sticky.prototype.addStickySidebar = function() {
    var sidebarDoc = stickynotes.Sidebar.getSidebarDoc();
    var url_tree = sidebarDoc.getElementById('tree' + this.url);
    var item = sidebarDoc.getElementById('item' + this.id);
    var url_item = sidebarDoc.getElementById('tree_page_' + this.page_id);
    if (!url_item) {
        url_item = stickynotes.Sidebar.createSidebarUrlItem(
            { id: this.id, url: this.url, title: this.title });
    }
    stickynotes.Sidebar.createSidebarStickyItem(this, url_item.treechildren);
};
/**
   stikcyをサイドバーから削除.
*/
stickynotes.Sticky.prototype.deleteStickySidebar = function() {
    var sidebarDoc = stickynotes.Sidebar.getSidebarDoc();
    var url_tree = sidebarDoc.getElementById('treeitem_' + this.page_id);
    if (url_tree == null) return;
    var sticky_tree = sidebarDoc.getElementById('sticky_tree');
    var item = sidebarDoc.getElementById('item' + this.id);
    var url_item = sidebarDoc.getElementById('tree_page_' + this.page_id);
    url_item.removeChild(item);
    if (url_item.childNodes.length == 0) {
        sticky_tree.removeChild(url_tree);
    }
};
/**
   サイドバー上のstickyを更新.
*/
stickynotes.Sticky.prototype.updateStickySidebar = function() {
    var sidebarDoc = stickynotes.Sidebar.getSidebarDoc();
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
/**
   stikcyにフォーカスを当てる.
*/
stickynotes.Sticky.prototype.focus = function() {
    this.textarea.focus();
};
/**
   stikcyへジャンプ.
*/
stickynotes.Sticky.prototype.jump = function() {
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
/**
   toString
   @return {String} string.
*/
stickynotes.Sticky.prototype.toString = function() {
    return 'sticky:' + this.id + ', ' + this.page_id + ', ' +
        this.left + ', ' + this.top + ', ' + this.width + ', ' +
        this.height + ', ' + this.content + ', ' + this.color;
};
/**
  stickyの可視性をトグル.
*/
stickynotes.Sticky.toggleVisibilityAllStickies = function() {
    var doc = window.content.document;//
    var URL = doc.location.href;
    var page = stickynotes.DAO.getPageByUrl(URL);
    var stickies = stickynotes.DAO.getStickiesByPageId(page.id);
    for (var i = 0; i < stickies.length; i++) {
        var stickyDom = doc.getElementById('sticky' + stickies[i].id);
        if (stickyDom.style.visibility == 'hidden')
            stickyDom.style.visibility = 'visible';
        else
            stickyDom.style.visibility = 'hidden';
    }
};
