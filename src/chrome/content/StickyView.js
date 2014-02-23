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
 * change element size.
 */
stickynotes.Sticky.changeElemSize = 35,
/**
 * update dom element.
*/
stickynotes.StickyView.prototype.updateDom = function() {
  var doc = window.content.document;
  var stickyDom = doc.getElementById('sticky' + this.id);
  if (stickyDom) {
  }
};
/**
 * remove dom element.
 */
stickynotes.StickyView.prototype.deleteDom = function() {
  var doc = window.content.document;
  doc.body.removeChild(this.dom);
};
/**
 * create dom element.
 */
stickynotes.StickyView.prototype.createDom = function() {
  var doc = window.content.document;
  var that = this;
  this.dom = doc.createElement('div');
  this.dom.id = 'sticky' + this.sticky.id;
  this.dom.style.position = 'absolute';
  this.dom.style.left = this.sticky.left + 'px';
  this.dom.style.top = this.sticky.top + 'px';
  this.dom.style.background = '#f1c40f';
  this.dom.style.opacity = 0.85;
  this.dom.style.borderRadius = '10px';
  this.dom.style.zIndex = '10000';
  this.dom.className = 'sticky';
  this.textarea = this.createTextarea();
  this.dragBar = this.createDragBar();
  this.tagBox = this.createTagBox();
  this.deleteButton = this.createDeleteButton();

  this.dom.appendChild(this.dragBar);
  this.dom.appendChild(this.deleteButton);
  this.dom.appendChild(this.textarea);
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
           e.clientX < right + stickynotes.Sticky.changeElemSize) &&
          (bottom - stickynotes.Sticky.changeElemSize < e.clientY &&
           e.clientY < bottom + stickynotes.Sticky.changeElemSize)) {
        that.resize(that.dom, e);
      }
    },
    true);
};
stickynotes.StickyView.prototype.createTextarea = function() {
  var doc = window.content.document;
  var textarea = doc.createElement('textarea');
  textarea.style.position = 'relative';
  textarea.style.width = this.sticky.width + 'px';
  textarea.style.height = this.sticky.height - 7 + 'px';
  textarea.value = this.sticky.content;
  textarea.style.backgroundColor = 'transparent';
  textarea.id = 'sticky_id_' + this.sticky.id;
  textarea.style.border = 'none';
  textarea.style.margin = '0px';
  textarea.style.overflow = 'auto';
  textarea.style.fontSize = '13px';
  textarea.style.fontWeight = 'normal';
  textarea.style.lineHeight = '14px';
  textarea.style.fontFamily = 'trebuchet ms';
  textarea.style.paddingTop = '4px';
  textarea.style.paddingLeft = '4px';
  textarea.className = 'textArea';
  textarea.placeholder = localizedStrings.placeholderText;
  textarea.sticky = this;
  textarea.addEventListener('focus', function(e) {
      this.placeholder = '';
  },false);
  textarea.addEventListener('blur', function(e) {
      this.placeholder = localizedStrings.placeholderText;
  },false);
  textarea.addEventListener('keydown', function(e) {
    if (e.keyCode == 68 && e.ctrlKey && e.shiftKey) {
      e.target.sticky.remove();
    }
  },false);
  return textarea;
};
stickynotes.StickyView.prototype.createDeleteButton = function() {
  var doc = window.content.document;
  var deleteButton = doc.createElement('button');
  deleteButton.style.position = 'absolute';
  deleteButton.style.width = '20px';
  deleteButton.style.cursor = 'pointer';
  deleteButton.style.borderRadius = '20px';
  deleteButton.style.border = '1px solid #AEAEAE';
  deleteButton.style.color = '#FFFFFF';
  deleteButton.style.backgroundColor = '#605F61';

  deleteButton.style.fontFamily = 'fantasy';
  deleteButton.style.fontWeight = 'bold';
  deleteButton.style.fontSize = '20px';
  deleteButton.style.lineHeight = '0px';
  deleteButton.style.height = '20px';
  deleteButton.style.right = '0px';
  deleteButton.style.top = '0px';
  deleteButton.className = 'deleteButton';
  deleteButton.style.marginTop = '3px';
  deleteButton.style.marginRight = '3px';
  deleteButton.style.paddingTop = '7px';
  deleteButton.style.paddingLeft = '7px';
  deleteButton.style.display = 'inline-block';
  deleteButton.style.textAlign = 'center';

  deleteButton.innerHTML = '✖';
  return deleteButton;
};
stickynotes.StickyView.prototype.createDragBar = function() {
  var doc = window.content.document;
  var dragBar = doc.createElement('div');
  dragBar.style.position = 'relative';
  dragBar.style.width = this.sticky.width - 10 + 'px';
  dragBar.style.height = '26px';
  dragBar.style.borderBottom = 'solid 1px yellow';
  dragBar.style.margin = '0px';
  dragBar.style.cursor = 'move';
  dragBar.className = 'dragBar';
//  dragBar.style.backgroundColor = this.sticky.color;
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
  tagBox.style.backgroundColor = 'white';
  tagBox.style.height = '20px';
  tagBox.style.width = '50px';
  tagBox.style.right = '26px';
  tagBox.style.top = '2px';
  tagBox.style.margin = '0px';
  tagBox.style.padding = '0px';
  tagBox.style.borderRadius = '3px';
  tagBox.style.border = 'solid 1px #ccc';
  tagBox.placeholder = 'tag';

  tagBox.style.fontSize = '13px';
  tagBox.style.fontWeight = 'normal';
  tagBox.style.lineHeight = '14px';
  tagBox.style.fontFamily = 'trebuchet ms';

  return tagBox;
};

/**
 * enable drag.
 * @param {Object} elem target element.
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
 * enable drag resize.
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
 * focus to sticky.
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
};
stickynotes.StickyView.toggleVisibilityAllStickies = function() {
  var doc = window.content.document;
  var URL = doc.location.href;
  var page = stickynotes.Page.fetchByUrl(URL);
  var stickies = stickynotes.Sticky.fetchByPage(page);
  for (var i = 0; i < stickies.length; i++) {
    var stickyDom = doc.getElementById('sticky' + stickies[i].id);
    if (stickynotes.StickyView.StickiesVisibility)
      stickyDom.style.visibility = 'hidden';
    else
      stickyDom.style.visibility = 'visible';
  }
  stickynotes.StickyView.StickiesVisibility =
    !stickynotes.StickyView.StickiesVisibility;
};
stickynotes.StickyView.StickiesVisibility = true;
