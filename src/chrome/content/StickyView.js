/**
 * @constructor
 * @param {Object} param param.
 */
stickynotes.StickyView = function(param) {
  this.sticky = param.sticky;
  this.onClickDeleteButton = param.onClickDeleteButton;
  this.onTextareaChange = param.onTextareaChange;
  this.onTagTextareaChange = param.onTagTextareaChange;
  this.onMoveEnd = param.onMoveEnd;
  this.onResizeEnd = param.onResizeEnd;
  this.createDom();
};

/**
 * 大きさかえるDOM要素のサイズ
 */
stickynotes.Sticky.changeElemSize = 35,
/**
 * stikcyのDOM要素を更新
*/
stickynotes.StickyView.prototype.updateDom = function() {
  var doc = window.content.document;
  var stickyDom = doc.getElementById('sticky' + this.id);
  if (stickyDom) {
  }
};
/**
 * stikcyのDOM要素を削除
 */
stickynotes.StickyView.prototype.deleteDom = function() {
  var doc = window.content.document;
  doc.body.removeChild(this.dom);
};
/**
 * stikcyのDOM要素を作成
 */
stickynotes.StickyView.prototype.createDom = function() {
  var doc = window.content.document;//表示しているDocumentを取得
  var that = this;
  this.dom = doc.createElement('div');
  this.dom.id = 'sticky' + this.sticky.id;
  this.dom.style.position = 'absolute';
  this.dom.style.left = this.sticky.left + 'px';
  this.dom.style.top = this.sticky.top + 'px';
  //sticky.style.border = "3px outset gray";
  this.dom.style.zIndex = '100';
  this.dom.className = 'sticky';
  this.textarea = this.createTextarea();
  this.dragBar = this.createDragBar();
  this.tagBox = this.createTagBox();
  this.deleteButton = this.createDeleteButton();
  this.changeSize = this.createChangeSize();
  
  this.dom.appendChild(this.dragBar);
  this.dom.appendChild(this.deleteButton);
  this.dom.appendChild(this.textarea);
  this.dom.appendChild(this.changeSize);
  this.dom.appendChild(this.tagBox);
  
  this.dragBar.addEventListener('mousedown',
                                function(e) {
                                  that.drag(this.parentNode, e);
                                },
                                true);
  this.deleteButton.addEventListener('click',
                                     function(e) {
                                       that.onClickDeleteButton(e);
                                       e.stopPropagation();
                                     },
                                     true);
  this.textarea.addEventListener('change',
                                 function(e) {
                                   if (that.content != that.textarea.value) {
                                     that.onTextareaChange();
                                   }
                                 },
                                 true);
  this.tagBox.addEventListener('change', function() {
    that.onTagTextareaChange();
  }, false);
  function getElementPosition(elem) {
    var position = elem.getBoundingClientRect();
    return {
      left: Math.round(window.scrollX + position.left),
      top: Math.round(window.scrollY + position.top)
    };
  }
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
stickynotes.StickyView.prototype.createTextarea = function() {
  var doc = window.content.document;
  //-- テキストを保持するinput要素--
  var textarea = doc.createElement('textarea');
  textarea.style.position = 'relative';
  textarea.style.width = this.sticky.width + 'px';
  textarea.style.height = this.sticky.height - 7 + 'px';
  textarea.value = this.sticky.content;
  textarea.style.fontWeight = 'bold';
  textarea.id = 'sticky_id_' + this.sticky.id;
  textarea.style.border = 'none';
  textarea.style.margin = '0px';
  textarea.style.backgroundColor = this.sticky.color;
  //textarea.style.opacity= "1.5";
  textarea.style.overflow = 'auto';
  textarea.className = 'textArea';
  textarea.sticky = this;
  textarea.addEventListener('keydown', function(e) {
    if (e.keyCode == 68 && e.ctrlKey && e.shiftKey) {
      e.target.sticky.remove();
    }
  },false);
  return textarea;
};
stickynotes.StickyView.prototype.createDeleteButton = function() {
  var doc = window.content.document;
  var deleteButton = doc.createElement('div');
  deleteButton.style.position = 'absolute';
  deleteButton.style.width = '10px';
  deleteButton.style.fontFamily = 'fantasy';
  deleteButton.style.height = '22px';
  deleteButton.style.right = 0 + 'px';
  deleteButton.style.top = '0px';
  deleteButton.className = 'deleteButton';
  deleteButton.style.backgroundColor = this.sticky.color;
  deleteButton.style.margin = '0px';
  deleteButton.style.padding = '0px';
  deleteButton.style.textAlign = 'start';
  deleteButton.style.borderBottom = 'inset';
  deleteButton.style.color = 'black';
  deleteButton.innerHTML = 'x';
  return deleteButton;
};
stickynotes.StickyView.prototype.createDragBar = function() {
  var doc = window.content.document;
  var dragBar = doc.createElement('div');
  dragBar.style.position = 'relative';
  dragBar.style.width = this.sticky.width - 10 + 'px';
  dragBar.style.height = '22px';
  dragBar.style.borderBottom = 'inset';
  dragBar.style.margin = '0px';
  dragBar.className = 'dragBar';
  dragBar.style.backgroundColor = this.sticky.color;
  return dragBar;
};
stickynotes.StickyView.prototype.createTagBox = function() {
  var doc = window.content.document;
  var tagBox = doc.createElement('input');
  var tags = this.sticky.getTags();
  var str = '';
  for (var i = 0; i < tags.length; str += ',', i++) {
    str += tags[i].name;
  }
  tagBox.value = str;
  tagBox.style.position = 'absolute';
  tagBox.style.width = '50px';
  tagBox.style.right = 30 + 'px';
  tagBox.style.top = '0px';
  return tagBox;
};
stickynotes.StickyView.prototype.createChangeSize = function() {
  var doc = window.content.document;
  var changeSize = doc.createElement('div');
  changeSize.style.position = 'absolute';
  changeSize.style.left = this.sticky.width - 5 + 'px';
  changeSize.style.top = this.sticky.height + 6 + 'px';
  changeSize.style.width = '20px';
  changeSize.style.height = '20px';
  changeSize.className = 'changeSize';
  changeSize.style.fontSize = '70%';
  changeSize.style.fontFamily = 'san-serif';
  changeSize.innerHTML = '';
  changeSize.style.padding = '0px';
  changeSize.style.margin = '0px';
  changeSize.style.textAlign = 'start';
  return changeSize;
};

/**
 * stikcyのDOM要素をドラッグ可能にする.
 * @param {Object} elem DOM要素.
 * @param {e} e event.
 */
stickynotes.StickyView.prototype.drag = function(elem, e) {
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
    that.onMoveEnd();
    e.stopPropagation();
  }
};
/**
 * stikcyのDOM要素をリサイズ可能にする.
 */
stickynotes.StickyView.prototype.resize = function(elem, e) {
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
    that.onResizeEnd();
    e.stopPropagation();
  }
};
/**
 * stikcyにフォーカスを当てる.
 */
stickynotes.StickyView.prototype.focus = function() {
  this.textarea.focus();
};
/**
 * toString
 * @return {String} string.
 */
stickynotes.StickyView.prototype.toString = function() {
  return 'sticky:' + this.sticky.id;
};
/**
 * stickyをkeyで絞り込み.
 */
stickynotes.StickyView.search = function(key) {
  var doc = window.content.document;
  var URL = doc.location.href;
  var page = stickynotes.Page.fetchByUrl(URL);
  var stickies = stickynotes.Sticky.fetchByPage(page);
  for (var i = 0; i < stickies.length; i++) {
    var stickyDom = doc.getElementById('sticky' + stickies[i].id);
    if (stickies[i].filter(key)) {
      stickyDom.style.visibility = 'visible';
    }
    else {
      stickyDom.style.visibility = 'hidden';
    }
  }
};n
/**
 * stickyの可視性をトグル.
 */
stickynotes.StickyView.toggleVisibilityAllStickies = function() {
  var doc = window.content.document;
  var URL = doc.location.href;
  var page = stickynotes.Page.fetchByUrl(URL);
  var stickies = stickynotes.Sticky.fetchByPage(page);
  for (var i = 0; i < stickies.length; i++) {
    var stickyDom = doc.getElementById('sticky' + stickies[i].id);
    if (stickyDom.style.visibility == 'hidden')
      stickyDom.style.visibility = 'visible';
    else
      stickyDom.style.visibility = 'hidden';
  }
};
