var CONTAINER       = 'stickynotes-sticky-container';
var DRAGGING        = 'stickynotes-sticky-container-dragging';
var BUTTON          = 'stickynotes-toolbar-button';
var DELETE_BUTTON   = 'stickynotes-delete-button';
var EDIT_TAG_BUTTON = 'stickynotes-edit-tag-button';
var MINIMIZE_BUTTON = 'stickynotes-minimize-button';
var MENU_BUTTON     = 'stickynotes-menu-button';
var TEXTAREA        = 'stickynotes-textarea';
var TOOLBAR         = 'stickynotes-toolbar';
var RESIZE_AREA     = 'stickynotes-resize-area';
var RESIZE_SIZE     = 35;
var MIN_WIDTH       = 150;
var MIN_HEIGHT      = 30;

stickynotes.StickyView = function(param) {
  this.sticky              = param.sticky;
  this.onClickDeleteButton = param.onClickDeleteButton;
  this.onTextareaChange    = param.onTextareaChange;
  this.onTagTextareaChange = param.onTagTextareaChange;
  this.onMoveEnd           = param.onMoveEnd;
  this.onResizeEnd         = param.onResizeEnd;
  this.drag                =  this.drag.bind(this);
  this.onContentChange     = this.onContentChange.bind(this);
  this.onTextareaMouseDown = this.onTextareaMouseDown.bind(this);
  this.onTextareaKeyDown   = this.onTextareaKeyDown.bind(this);

  this.createDom();
  this.updateDom();
  this.bind();
};

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
  this.dom.style.left       = this.sticky.left   + 'px';
  this.dom.style.top        = this.sticky.top    + 'px';
  this.dom.style.width      = this.sticky.width  + 'px';
  this.dom.style.height     = this.sticky.height + 'px';
  this.dom.style.background = '#f1c40f';
  this.dom.className        = CONTAINER;

  var textarea              = this.textarea;
  textarea.value            = this.sticky.content;
  textarea.id               = 'sticky_id_' + this.sticky.uuid;
  textarea.placeholder      = stickynotes.strings['sticky.placeholderText'];
  textarea.sticky           = this;
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
  var id   = 'sticky' + this.sticky.uuid;
  var doc  = stickynotes.doc;
  this.dom = doc.createElement('div');
  this.dom.id = id;
  this.dom.__stickyView = this;

  this.textarea                 = doc.createElement('textarea');
  this.textarea.className       = TEXTAREA;
  this.toolbar                  = doc.createElement('div');
  this.toolbar.className        = TOOLBAR;
  this.deleteButton             = doc.createElement('div');
  this.deleteButton.className   = BUTTON + ' ' + DELETE_BUTTON;
  this.minimizeButton           = doc.createElement('div');
  this.minimizeButton.className = BUTTON + ' ' + MINIMIZE_BUTTON;
  this.editTagButton            = doc.createElement('div');
  this.editTagButton.className  = BUTTON + ' ' + EDIT_TAG_BUTTON;
  this.menuButton               = doc.createElement('div');
  this.menuButton.className     = BUTTON + ' ' + MENU_BUTTON;

  this.toolbar.appendChild(this.deleteButton);
  this.toolbar.appendChild(this.minimizeButton);
  this.toolbar.appendChild(this.menuButton);
  this.toolbar.appendChild(this.editTagButton);

  this.dom.appendChild(this.toolbar);
  this.dom.appendChild(this.textarea);
};

stickynotes.StickyView.prototype.bind = function() {
  this.toolbar.addEventListener('mousedown',  this.drag, true);
  this.deleteButton.addEventListener('click', this.onClickDeleteButton, true);
  this.textarea.addEventListener('change',    this.onContentChange, true);
  this.textarea.addEventListener('mousedown', this.onTextareaMouseDown);
  this.textarea.addEventListener('keydown',   this.onTextareaKeyDown, false);
};

stickynotes.StickyView.prototype.unbind = function() {
  this.toolbar.removeEventListener('mousedown',  this.drag, true);
  this.deleteButton.removeEventListener('click', this.onClickDeleteButton, true);
  this.textarea.removeEventListener('change',    this.onContentChange, true);
  this.textarea.removeEventListener('mousedown', this.onTextareaMouseDown);
};

stickynotes.StickyView.prototype.onContentChange = function() {
  if (this.content != this.textarea.value) {
    this.onTextareaChange();
  }
};

stickynotes.StickyView.prototype.onTextareaKeyDown = function(e) {
  if (e.keyCode == 68 && e.ctrlKey && e.shiftKey) {
    e.target.sticky.remove();
  }
};

stickynotes.StickyView.prototype.getElementPosition = function(elem) {
  var position = elem.getBoundingClientRect();
  return {
     top: Math.round(window.scrollY + position.top),
    left: Math.round(window.scrollX + position.left)
  };
};

stickynotes.StickyView.prototype.onTextareaMouseDown = function(e) {
  var pos    = this.getElementPosition(this.dom);
  var right  = pos.left + parseInt(this.dom.style.width);
  var bottom = pos.top  + parseInt(this.dom.style.height);

  if ((right - RESIZE_SIZE < e.clientX  && e.clientX < right + RESIZE_SIZE) &&
      (bottom - RESIZE_SIZE < e.clientY && e.clientY < bottom + RESIZE_SIZE)) {
    this.resize(this.dom, e);
  }
};

/**
 * enable drag.
 * @param {Object} elem target element.
 * @param {e} e event.
 */
stickynotes.StickyView.prototype.drag = function(e) {
  var elem   = this.dom;
  var that   = this;
  var URL    = stickynotes.doc.location.href;
  var startX = e.clientX      , startY = e.clientY;
  var origX  = elem.offsetLeft, origY  = elem.offsetTop;
  var deltaX = startX - origX , deltaY = startY - origY;
  elem.className = CONTAINER + ' ' + DRAGGING;
  stickynotes.doc.addEventListener('mousemove', moveHandler, true);
  stickynotes.doc.addEventListener('mouseup'  , upHandler  , true);
  e.stopPropagation();
  e.preventDefault();
  function moveHandler(e) {
    elem.style.left = (e.clientX - deltaX) + 'px';
    elem.style.top  = (e.clientY - deltaY) + 'px';
    e.stopPropagation();
    e.preventDefault();
  }
  function upHandler(e) {
    elem.className = CONTAINER;
    stickynotes.doc.removeEventListener('mouseup'  , upHandler  , true);
    stickynotes.doc.removeEventListener('mousemove', moveHandler, true);
    that.onMoveEnd();
    e.stopPropagation();
    e.preventDefault();
  }
};
/**
 * enable drag resize.
 */
stickynotes.StickyView.prototype.resize = function(elem, e) {
  var that       = this;
  var URL        = stickynotes.doc.location.href;
  var origX      = elem.offsetLeft, origY  = elem.offsetTop;
  var deltaX     = startX - origX , deltaY = startY - origY;
  var startX     = e.clientX      , startY = e.clientY;
  var origWidth  = parseInt(that.dom.style.width),
      origHeight = parseInt(that.dom.style.height);
  var deltaWidth = startX - origWidth, deltaHeight = startY - origHeight;
  stickynotes.doc.addEventListener('mousemove', moveHandler, true);
  stickynotes.doc.addEventListener('mouseup'  , upHandler  , true);
  e.stopPropagation();
  e.preventDefault();
  function moveHandler(e) {
    var width  = e.clientX - deltaWidth;
    var height = e.clientY - deltaHeight;
    if (width < MIN_WIDTH || height < MIN_HEIGHT) return;

    that.dom.style.width  = width  + 'px';
    that.dom.style.height = height + 'px';

    e.stopPropagation();
  }
  function upHandler(e) {
    stickynotes.doc.removeEventListener('mouseup'  , upHandler  , true);
    stickynotes.doc.removeEventListener('mousemove', moveHandler, true);
    that.width  = parseInt(that.dom.style.width);
    that.height = parseInt(that.dom.style.height) + 7;
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
  return document.activeElement === this.textarea;
};

stickynotes.StickyView.str2Tags = function(str) {
  var tags_str = (str + ',').replace(/^[\s　]+|[\s　]+$/g, '');
  var tags     = [];
  var _tags    = (tags_str).split(',');
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
  var URL      = stickynotes.doc.location.href;
  var page     = stickynotes.Page.fetchByUrl(URL);
  var stickies = stickynotes.Sticky.fetchByPage(page);
  for (var i = 0; i < stickies.length; i++) {
    var d = stickynotes.doc.getElementById('sticky' + stickies[i].iuud);
    if (stickies[i].filter(key)) d.style.visibility = 'visible';
    else                         d.style.visibility = 'hidden';
  }
};
stickynotes.StickyView.toggleVisibilityAllStickies = function(stickies) {
  var isVisible = stickynotes.StickyView.StickiesVisibility;
  for (var i = 0; i < stickies.length; i++) {
    var d = stickynotes.doc.getElementById('sticky' + stickies[i].uuid);
    if (isVisible) d.style.visibility = 'hidden';
    else           d.style.visibility = 'visible';
  }
  stickynotes.StickyView.StickiesVisibility = !isVisible;
  return !isVisible;
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

