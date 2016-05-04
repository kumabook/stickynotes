var CONTAINER     = 'stickynotes-sticky-container';
var DELETE_BUTTON = 'stickynotes-delete-button';
var TEXTAREA      = 'stickynotes-textarea';
var DRAG_BAR      = 'stickynotes-drag-bar';
var TAG_BOX       = 'stickynotes-tag-box';

stickynotes.StickyView = function(param) {
  this.sticky = param.sticky;
  this.onClickDeleteButton = param.onClickDeleteButton;
  this.onTextareaChange = param.onTextareaChange;
  this.onTagTextareaChange = param.onTagTextareaChange;
  this.onMoveEnd = param.onMoveEnd;
  this.onResizeEnd = param.onResizeEnd;
  this.createDom();
  this.updateDom();

  this.drag =  this.drag.bind(this);
  this.onContentChange = this.onContentChange.bind(this);
  this.onTextareaMouseDown = this.onTextareaMouseDown.bind(this);
  this.onTextareaKeyDown = this.onTextareaKeyDown.bind(this);

  this.bind();
};

stickynotes.StickyView.changeElemSize = 35;

stickynotes.StickyView.deleteAll = function() {
  var elements = stickynotes.doc.getElementsByClassName(CONTAINER);
  for (var i = elements.length - 1; i >= 0; i--) {
    stickynotes.doc.body.removeChild(elements[i]);
  }
};

/**
 * update dom element.
*/
stickynotes.StickyView.prototype.updateDom = function() {
  this.dom.style.position = 'absolute';
  this.dom.style.left = this.sticky.left + 'px';
  this.dom.style.top = this.sticky.top + 'px';
  this.dom.style.background = '#f1c40f';
  this.dom.className = CONTAINER;
  this.updateTextarea();
  this.updateDeleteButton();
  this.updateDragBar();
  this.updateTagBox();
};
/**
 * remove dom element.
 */
stickynotes.StickyView.prototype.deleteDom = function() {
  this.unbind();
  stickynotes.doc.body.removeChild(this.dom);
};
/**
 * create dom element.
 */
stickynotes.StickyView.prototype.createDom = function() {
  var that = this;
  var id = 'sticky' + this.sticky.uuid;
  this.dom = stickynotes.doc.createElement('div');
  this.dom.id = id;
  this.dom.__stickyView = this;
  this.textarea = stickynotes.doc.createElement('textarea');
  this.dragBar = stickynotes.doc.createElement('div');
  this.tagBox =  stickynotes.doc.createElement('input');
  this.deleteButton = stickynotes.doc.createElement('button');

  this.dom.appendChild(this.dragBar);
  this.dom.appendChild(this.deleteButton);
  this.dom.appendChild(this.textarea);
  this.dom.appendChild(this.tagBox);
};

stickynotes.StickyView.prototype.bind = function() {
  this.dragBar.addEventListener('mousedown',  this.drag, true);
  this.deleteButton.addEventListener('click', this.onClickDeleteButton, true);
  this.textarea.addEventListener('change',    this.onContentChange, true);
  this.tagBox.addEventListener('change',      this.onTagTextareaChange, false);
  this.textarea.addEventListener('mousedown', this.onTextareaMouseDown);
  this.textarea.addEventListener('keydown',   this.onTextareaKeyDown, false);
  this.textarea.addEventListener('focus',     this.clearPlaceHolder, false);
  this.textarea.addEventListener('blur',      this.setPlaceHolder, false);
  this.tagBox.addEventListener('focus',       this.clearPlaceHolder, false);
  this.tagBox.addEventListener('blur',        this.setTagBoxPlaceHolder, false);
};

stickynotes.StickyView.prototype.unbind = function() {
  this.dragBar.removeEventListener('mousedown',  this.drag, true);
  this.deleteButton.removeEventListener('click', this.onClickDeleteButton, true);
  this.textarea.removeEventListener('change',    this.onContentChange, true);
  this.tagBox.removeEventListener('change',      this.onTagTextareaChange, false);
  this.textarea.removeEventListener('mousedown', this.onTextareaMouseDown);
};

stickynotes.StickyView.prototype.onContentChange = function() {
  if (this.content != this.textarea.value) {
    this.onTextareaChange();
  }
};

stickynotes.StickyView.prototype.setPlaceHolder = function(e) {
  this.placeholder = stickynotes.strings['sticky.placeholderText'];
};

stickynotes.StickyView.prototype.setTagBoxPlaceHolder = function(e) {
  this.placeholder = 'tag, ...';;
};

stickynotes.StickyView.prototype.clearPlaceHolder = function(e) {
  this.placeholder = '';
};

stickynotes.StickyView.prototype.onTextareaKeyDown = function(e) {
  if (e.keyCode == 68 && e.ctrlKey && e.shiftKey) {
    e.target.sticky.remove();
  }
};

stickynotes.StickyView.prototype.getElementPosition = function(elem) {
  var position = elem.getBoundingClientRect();
  return {
    left: Math.round(window.scrollX + position.left),
    top: Math.round(window.scrollY + position.top)
  };
};

stickynotes.StickyView.prototype.onTextareaMouseDown = function(e) {
  var pos = this.getElementPosition(this.textarea);
  var right = pos.left + parseInt(this.textarea.style.width);
  var bottom = pos.top + parseInt(this.textarea.style.height);

  if ((right - stickynotes.StickyView.changeElemSize < e.clientX &&
       e.clientX < right + stickynotes.StickyView.changeElemSize) &&
      (bottom - stickynotes.StickyView.changeElemSize < e.clientY &&
       e.clientY < bottom + stickynotes.StickyView.changeElemSize)) {
    this.resize(this.dom, e);
  }
};


stickynotes.StickyView.prototype.updateTextarea = function() {
  var textarea = this.textarea;
  textarea.style.position = 'relative';
  textarea.style.width = this.sticky.width + 'px';
  textarea.style.height = (this.sticky.height - 7 - 26) + 'px';
  textarea.value = this.sticky.content;
  textarea.style.backgroundColor = 'transparent';
  textarea.id = 'sticky_id_' + this.sticky.uuid;
  textarea.className = TEXTAREA;
  textarea.placeholder = stickynotes.strings['sticky.placeholderText'];
  textarea.sticky = this;
};
stickynotes.StickyView.prototype.updateDeleteButton = function() {
  var deleteButton = this.deleteButton;
  deleteButton.className = DELETE_BUTTON;
  deleteButton.innerHTML = '✖';
};
stickynotes.StickyView.prototype.updateDragBar = function() {
  var dragBar = this.dragBar;
  dragBar.style.width = this.sticky.width - 10 + 'px';
  dragBar.className = DRAG_BAR;
//  dragBar.style.backgroundColor = this.sticky.color;
};
stickynotes.StickyView.prototype.updateTagBox = function() {
  var tagBox = this.tagBox;
  var tags = this.sticky.tags;
  var str = '';
  for (var i = 0; i < tags.length; str += ',', i++) {
    str += tags[i].name;
  }
  tagBox.value = str;
  tagBox.className = TAG_BOX;
  tagBox.placeholder = 'tag, ...';
};

/**
 * enable drag.
 * @param {Object} elem target element.
 * @param {e} e event.
 */
stickynotes.StickyView.prototype.drag = function(e) {
  var elem = this.dom;
  var that = this;
  var URL = stickynotes.doc.location.href;
  var startX = e.clientX, startY = e.clientY;
  var origX = elem.offsetLeft, origY = elem.offsetTop;
  var deltaX = startX - origX, deltaY = startY - origY;
  stickynotes.doc.addEventListener('mousemove', moveHandler, true);
  stickynotes.doc.addEventListener('mouseup', upHandler, true);
  e.stopPropagation();
  e.preventDefault();
  function moveHandler(e) {
    elem.style.left = (e.clientX - deltaX) + 'px';
    elem.style.top = (e.clientY - deltaY) + 'px';
    e.stopPropagation();
  }
  function upHandler(e) {
    stickynotes.doc.removeEventListener('mouseup', upHandler, true);
    stickynotes.doc.removeEventListener('mousemove', moveHandler, true);
    that.onMoveEnd();
    e.stopPropagation();
  }
};
/**
 * enable drag resize.
 */
stickynotes.StickyView.prototype.resize = function(elem, e) {
  var that = this;
  var URL = stickynotes.doc.location.href;
  var origX = elem.offsetLeft, origY = elem.offsetTop;
  var deltaX = startX - origX, deltaY = startY - origY;
  var startX = e.clientX, startY = e.clientY;
  var origWidth = parseInt(that.textarea.style.width),
      origHeight = parseInt(that.textarea.style.height);
  var deltaWidth = startX - origWidth, deltaHeight = startY - origHeight;
  stickynotes.doc.addEventListener('mousemove', moveHandler, true);
  stickynotes.doc.addEventListener('mouseup', upHandler, true);
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
    stickynotes.doc.removeEventListener('mouseup', upHandler, true);
    stickynotes.doc.removeEventListener('mousemove', moveHandler, true);
    that.width = parseInt(that.textarea.style.width);
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

stickynotes.StickyView.prototype.isEditing = function() {
  return document.activeElement === this.textarea ||
         document.activeElement === this.tagBox;
};

stickynotes.StickyView.str2Tags = function(str) {
  var tags_str = (str + ',').replace(/^[\s　]+|[\s　]+$/g, '');
  var tags = [];
  var _tags = (tags_str).split(',');
  _tags = _tags.slice(0, _tags.length - 1);
  for (var i = 0; i < _tags.length; i++) {
    _tags[i] = _tags[i].replace(/^[\s　]+|[\s　]+$/g, '');
    if (!_tags[i] == '') {//remove blank str
      var isUnique = true;
      for (var j = 0; j < tags.length; j++) {//remove duplicated str
        if (tags[j] == _tags[i]) {
          isUnique = false;
        }
      }
      if (isUnique)
        tags.push(_tags[i]);
    }
  }
  return tags;
};
/**
 * toString
 * @return {String} string.
 */
stickynotes.StickyView.prototype.toString = function() {
  return 'sticky:' + this.sticky.uuid;
};

stickynotes.StickyView.search = function(key) {
  var URL = stickynotes.doc.location.href;
  var page = stickynotes.Page.fetchByUrl(URL);
  var stickies = stickynotes.Sticky.fetchByPage(page);
  for (var i = 0; i < stickies.length; i++) {
    var stickyDom = stickynotes.doc.getElementById('sticky' + stickies[i].iuud);
    if (stickies[i].filter(key)) {
      stickyDom.style.visibility = 'visible';
    }
    else {
      stickyDom.style.visibility = 'hidden';
    }
  }
};
stickynotes.StickyView.toggleVisibilityAllStickies = function(stickies) {
  for (var i = 0; i < stickies.length; i++) {
    var stickyDom = stickynotes.doc.getElementById('sticky' + stickies[i].uuid);
    if (stickynotes.StickyView.StickiesVisibility)
      stickyDom.style.visibility = 'hidden';
    else
      stickyDom.style.visibility = 'visible';
  }
  stickynotes.StickyView.StickiesVisibility =
    !stickynotes.StickyView.StickiesVisibility;
  return stickynotes.StickyView.StickiesVisibility;
};

stickynotes.StickyView.deleteDom = function(sticky) {
  var dom = stickynotes.doc.getElementById('sticky' + sticky.uuid);
  if (dom && dom.__stickyView) {
    dom.__stickyView.sticky = sticky;
    dom.__stickyView.deleteDom();
  }
};

stickynotes.StickyView.updateDom = function(sticky) {
  let dom = stickynotes.doc.getElementById('sticky' + sticky.uuid);
  if (dom && dom.__stickyView) {
    let str = 'Current editing sticky is updated. Do you update the sticky?';
    if (dom.__stickyView.isEditing() && !confirm(str)) {
      return;
    }
    dom.__stickyView.sticky = sticky;
    dom.__stickyView.updateDom();
  }
};

stickynotes.StickyView.StickiesVisibility = true;

