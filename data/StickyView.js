var CLASS           = 'stickynotes-sticky';
var LINE            = 'stickynotes-line';
var MINIMIZED       = 'stickynotes-sticky-minimized';
var DRAGGING        = 'stickynotes-sticky-dragging';
var BUTTON          = 'stickynotes-toolbar-button';
var BUTTON_ACTIVE   = 'stickynotes-toolbar-button-active';
var DELETE_BUTTON   = 'stickynotes-delete-button';
var EDIT_TAG_BUTTON = 'stickynotes-edit-tag-button';
var MINIMIZE_BUTTON = 'stickynotes-minimize-button';
var MENU_BUTTON     = 'stickynotes-menu-button';
var PIN_BUTTON      = 'stickynotes-pin-button';
var TEXTAREA        = 'stickynotes-textarea';
var TOOLBAR         = 'stickynotes-toolbar';
var BAND            = 'stickynotes-band';
var MENU_DIALOG     = 'stickynotes-menu-dialog';
var TAGS_DIALOG     = 'stickynotes-tags-dialog';
var LOCATION_DIALOG = 'stickynotes-location-dialog';
var TARGET          = 'stickynotes-target';
var MOVER           = 'stickynotes-mover';
var RESIZE_SIZE     = 35;
var MIN_WIDTH       = 150;
var MIN_HEIGHT      = 52;

const Status = {
  Normal:  'Normal',
  Pin:     'Pin',
  Pinning: 'Pinning'
};

stickynotes.getScrollOffset = function(elem, position) {
  var p = { left: 0, top: 0 };
  for (var n = elem.parentNode; n !== stickynotes.doc; n = n.parentNode) {
    p.left += n.scrollLeft;
    p.top += n.scrollTop;
  }
  return p;
};

stickynotes.StickyView = function(param) {
  this.sticky                = param.sticky;
  this.onClickDeleteButton   = param.onClickDeleteButton;
  this.onClickMinimizeButton = param.onClickMinimizeButton;
  this.onClickEditTagButton  = param.onClickEditTagButton;
  this.onClickMenuButton     = param.onClickMenuButton;
  this.onTextareaChange      = param.onTextareaChange;
  this.onTagsChange          = param.onTagsChange;
  this.onColorChange         = param.onColorChange;
  this.onMoveEnd             = param.onMoveEnd;
  this.onResizeEnd           = param.onResizeEnd;
  this.onPinEnd              = param.onPinEnd;
  this.onScroll              = this.onScroll.bind(this);
  this.togglePinStatus       = this.togglePinStatus.bind(this);
  this.drag                  = this.drag.bind(this);
  this.onContentChange       = this.onContentChange.bind(this);
  this.onTextareaKeyDown     = this.onTextareaKeyDown.bind(this);

  this.locationEditor = null;

  this.createDom();
  this.updateDom();
  this.bind();
  this.isDragging = false;
  this.status = Status.Normal;
  setTimeout(() => {
    this.updateLine();
  }, 0);
};

stickynotes.StickyView.State = {
  Normal: 0,
  Deleted: 1,
  Minimized: 2
};

stickynotes.StickyView.deleteAll = function() {
  var elements = stickynotes.doc.getElementsByClassName(CLASS);
  for (var i = elements.length - 1; i >= 0; i--) {
    elements[i].parentNode.removeChild(elements[i]);
  }
  elements = stickynotes.doc.getElementsByClassName(LINE);
  for (i = elements.length - 1; i >= 0; i--) {
    elements[i].parentNode.removeChild(elements[i]);
  }
};

stickynotes.StickyView.prototype.isMinimized = function() {
  return this.sticky.state === stickynotes.StickyView.State.Minimized;
};

stickynotes.StickyView.prototype.togglePinStatus = function() {
  if (this.status === Status.Normal) {
    this.status = Status.Pin;
    this.showLocationDialog();
    stickynotes.doc.addEventListener('scroll', this.onScroll, true);
    if (this.target) {
      stickynotes.addClass(this.target, TARGET);
    }
    this.pinButton.className = [BUTTON, BUTTON_ACTIVE, PIN_BUTTON].join(' ');
  } else if (this.status === Status.Pin) {
    this.status = Status.Normal;
    this.hideDialog();
    stickynotes.doc.removeEventListener('scroll', this.onScroll, true);
    if (this.target) {
      stickynotes.removeClass(this.target, TARGET);
    }
    this.pinButton.className = [BUTTON, PIN_BUTTON].join(' ');
  }
  this.updateLine();
};

stickynotes.StickyView.prototype.onScroll = function() {
  this.updateLine();
};

/**
 * update dom element.
*/
stickynotes.StickyView.prototype.updateDom = function() {
  this.dom.style.left       = this.sticky.left   + 'px';
  this.dom.style.top        = this.sticky.top    + 'px';
  this.updateClassName();
  this.statusUpdated();
  var textarea              = this.textarea;
  textarea.value            = this.sticky.content;
  textarea.id               = 'sticky_id_' + this.sticky.uuid;
  textarea.placeholder      = stickynotes.strings['sticky.placeholderText'];
  textarea.sticky           = this;
  if (this.isMinimized()) {
    this.dom.style.width        = null;
    this.dom.style.height       = null;
    this.toolbar.style.display  = 'none';
    this.textarea.style.display = 'none';
  } else {
    this.dom.style.width        = this.sticky.width + 'px';
    this.dom.style.height       = this.sticky.height + 'px';
    this.toolbar.style.display  = null;
    this.textarea.style.display = null;
  }
};

stickynotes.StickyView.prototype.updateLine = function() {
  const targetRect   = this.target.getBoundingClientRect();
  const rect         = this.dom.getBoundingClientRect();
  const offset       = stickynotes.getScrollOffset(stickynotes.doc.body);
  const targetOffset = stickynotes.getScrollOffset(stickynotes.doc.body);
  this.line.container.style.display = this.status !== Status.Pin ? 'none' : '';
  this.line.path.setAttribute('stroke', '#FF4500');

  stickynotes.drawLineTo(targetRect.x + targetOffset.left,
                  targetRect.y + targetOffset.top,
                  rect.x + offset.left + 11,
                  rect.y + offset.top + 11,
                  0, this.line);
};

stickynotes.StickyView.prototype.updateClassName = function() {
  var classNames = [CLASS];
  if (this.isMinimized()) {
    classNames.push(MINIMIZED);
  }
  if (this.isDragging) {
    classNames.push(DRAGGING);
  }
  this.dom.className = classNames.join(' ');
};

stickynotes.StickyView.prototype.statusUpdated = function() {
  var color = stickynotes.ColorPicker.getColorById(this.sticky.color);
  if (this.isMinimized()) {
    let c = color.background;
    let colors = ['rgb(200,200,200)', 'rgb(222,222,222)'];
    this.dom.style.background = 'linear-gradient(to right,' + colors.join(',') + ')';
    this.band.style.display = '';
    this.band.style.background = c;
  } else {
    if (color) {
      this.dom.style.color      = color.font;
      this.dom.style.background = color.background;
    } else {
      this.dom.style.background = this.sticky.background;
    }
    this.band.style.display = 'none';
  }
};

stickynotes.StickyView.prototype.showMenu = function() {
  this.hideDialog();
  this.dialog = new stickynotes.Dialog({ className: MENU_DIALOG});
  this.dialog.push(new stickynotes.StickyMenu({
    onSelectMenu: (item) => {
      switch (item.id) {
      case stickynotes.StickyMenu.Type.EditColor:
        var colorPicker = new stickynotes.ColorPicker({
          leftBarButtonClicked: () => {
            this.dialog.pop();
          },
          itemClicked: (item) => {
            this.onColorChange(item);
            this.statusUpdated();
          }
        });
        this.dialog.push(colorPicker);
        break;
      case stickynotes.StickyMenu.Type.PageOption:
        break;
      }
    },
    leftBarButtonClicked: () => { this.hideDialog(); }
  }));
  this.dom.appendChild(this.dialog.dom);
  this.dialog.dom.style.left = (this.sticky.width - 22) + 'px';
  this.dialog.dom.style.top = '32px';
  this.menuButton.className = [BUTTON, BUTTON_ACTIVE, MENU_BUTTON].join(' ');
};

stickynotes.StickyView.prototype.showTagDialog = function() {
  this.hideDialog();
  this.dialog = new stickynotes.Dialog({ className: TAGS_DIALOG});
  const changed = (names) => {
    this.onTagsChange(names);
    this.hideDialog();
  };
  var tagEditor = new stickynotes.TagEditor({
    items: this.sticky.tags.map((tag) => { return tag.name; }),
    changed: changed,
    leftBarButtonClicked: () => { this.hideDialog(); }
  });
  this.dialog.push(tagEditor);
  this.dialog.dom.style.height = '120px';
  this.dom.insertBefore(this.dialog.dom, this.toolbar.nextSibling);
  this.dialog.dom.style.left = (this.sticky.width - 44) + 'px';
  this.dialog.dom.style.top = '32px';
  this.editTagButton.className = [BUTTON, BUTTON_ACTIVE, EDIT_TAG_BUTTON].join(' ');
  tagEditor.focus();
};

stickynotes.StickyView.prototype.showLocationDialog = function() {
  this.hideDialog();
  this.dialog = new stickynotes.Dialog({ className: LOCATION_DIALOG});
  const locationEditor = new stickynotes.LocationEditor({
    stickyView: this,
    onPinStart: () => {
      this.status = Status.Pinning;
      this.updateClassName();
      this.updateLine();
    },
    onPinMove: () => {
    },
    onPinEnd: (target) => {
      this.status = Status.Pin;
      const container = this.getContainerElement(target);
      const xpath = stickynotes.getElementXPath(target);
      const r  = this.dom.parentNode.getBoundingClientRect();
      const tr = container.getBoundingClientRect();
      this.sticky.target = xpath;
      this.target = target;
      this.dom.parentNode.removeChild(this.dom);
      const left = parseInt(this.dom.style.left) + (r.x - tr.x);
      const top = parseInt(this.dom.style.top) + (r.y - tr.y);
      this.dom.style.left = Math.max(0, left) + 'px';
      this.dom.style.top  = Math.max(0, top) + 'px';
      this.dom.style.left = left + 'px';
      this.dom.style.top  = top + 'px';
      container.appendChild(this.dom);
      this.updateLine();
    },
    leftBarButtonClicked: () => {
      this.togglePinStatus();
      this.hideDialog();
    }
  });
  this.locationEditor = locationEditor;
  this.dialog.push(locationEditor);
  this.dom.insertBefore(this.dialog.dom, this.toolbar.nextSibling);
  this.dialog.dom.style.left = (this.sticky.width - 88) + 'px';
  this.dialog.dom.style.top = '32px';
};

stickynotes.StickyView.prototype.hideDialog = function() {
  if (this.dialog) {
    this.dom.removeChild(this.dialog.dom);
    this.dialog = null;
    this.menuButton.className    = [BUTTON, MENU_BUTTON].join(' ');
    this.editTagButton.className = [BUTTON, EDIT_TAG_BUTTON].join(' ');
    return;
  }
};

stickynotes.StickyView.prototype.attachDom = function() {
  this.container.appendChild(this.dom);
};

/**
 * remove dom element.
 */
stickynotes.StickyView.prototype.deleteDom = function() {
  this.unbind();
  this.dom.parentNode.removeChild(this.dom);
  if (this.status === Status.Pin) {
    this.line.container.parentNode.removeChild(this.line.container);
  }
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
  this.pinButton                = doc.createElement('div');
  this.pinButton.className      = BUTTON + ' ' + PIN_BUTTON;
  this.editTagButton            = doc.createElement('button');
  this.editTagButton.className  = BUTTON + ' ' + EDIT_TAG_BUTTON;
  this.menuButton               = doc.createElement('div');
  this.menuButton.className     = BUTTON + ' ' + MENU_BUTTON;

  this.band                     = doc.createElement('div');
  this.band.className           = BAND;

  this.toolbar.appendChild(this.deleteButton);
  this.toolbar.appendChild(this.minimizeButton);
  this.toolbar.appendChild(this.pinButton);
  this.toolbar.appendChild(this.menuButton);
  this.toolbar.appendChild(this.editTagButton);

  this.dom.appendChild(this.toolbar);
  this.dom.appendChild(this.textarea);
  this.dom.appendChild(this.band);

  this.maximize = this.maximize.bind(this);

  this.target = stickynotes.StickyView.getElementsByXPath(this.sticky.target);
  if (!this.target) {
    this.target = stickynotes.doc.body;
  }
  this.container = this.getContainerElement(this.target);
  const color = stickynotes.ColorPicker.getColorById(this.sticky.color);
  this.line = stickynotes.createLine('#FF4500', 'dot');
  stickynotes.doc.body.appendChild(this.line.container);
};

stickynotes.StickyView.prototype.bind = function() {
  this.deleteButton.addEventListener(  'click', this.onClickDeleteButton);
  this.minimizeButton.addEventListener('click', this.onClickMinimizeButton);
  this.editTagButton.addEventListener( 'click', this.onClickEditTagButton);
  this.editTagButton.addEventListener( 'focus', this.onClickEditTagButton);
  this.menuButton.addEventListener(    'click', this.onClickMenuButton);
  this.pinButton.addEventListener(     'click', this.togglePinStatus);

  this.textarea.addEventListener('change'   , this.onContentChange);
  this.textarea.addEventListener('keydown'  , this.onTextareaKeyDown);

  this.dom.addEventListener('mousedown', this.drag);
  this.dom.addEventListener( 'dblclick', this.maximize);
};

stickynotes.StickyView.prototype.unbind = function() {
  this.dom.removeEventListener(     'mousedown', this.drag);
  this.dom.removeEventListener(      'dblclick', this.maximize);

  this.deleteButton.removeEventListener(  'click', this.onClickDeleteButton);
  this.minimizeButton.removeEventListener('click', this.onClickMinimizeButton);
  this.editTagButton.removeEventListener( 'click', this.onClickEditTagButton);
  this.editTagButton.removeEventListener( 'focus', this.onClickEditTagButton);
  this.menuButton.removeEventListener(    'click', this.onClickMenuButton);

  this.textarea.removeEventListener('change'   , this.onContentChange);
  this.textarea.removeEventListener('keydown'  , this.onTextareaKeyDown);
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


/**
 * enable drag.
 * @param {Object} elem target element.
 * @param {e} e event.
 */
stickynotes.StickyView.prototype.drag = function(e) {
  var pos    = this.getElementPosition(this.dom);
  var right  = pos.left + parseInt(this.dom.style.width);
  var bottom = pos.top  + parseInt(this.dom.style.height);
  if ((right - RESIZE_SIZE < e.clientX  && e.clientX < right + RESIZE_SIZE) &&
      (bottom - RESIZE_SIZE < e.clientY && e.clientY < bottom + RESIZE_SIZE)) {
    this.hideDialog();
    this.resize(this.dom, e);
    return;
  }

  if (e.target !== this.textarea) {
    e.stopPropagation();
    e.preventDefault();
  }

  var elem   = this.dom;
  var that   = this;
  var URL    = stickynotes.doc.location.href;
  var startX = e.clientX      , startY = e.clientY;
  var origX  = elem.offsetLeft, origY  = elem.offsetTop;
  var deltaX = startX - origX , deltaY = startY - origY;
  this.isDragging = true;
  this.updateClassName();
  stickynotes.doc.addEventListener('mousemove', moveHandler, true);
  stickynotes.doc.addEventListener('mouseup'  , upHandler  , true);
  e.stopPropagation();
  function moveHandler(e) {
    const sticky = that.sticky;
    elem.style.left = (e.clientX - deltaX) + 'px';
    elem.style.top  = (e.clientY - deltaY) + 'px';
    e.stopPropagation();
    e.preventDefault();
    that.updateLine();
    sticky.left = parseInt(elem.style.left);
    sticky.top = parseInt(elem.style.top);
    if (that.locationEditor) {
      that.locationEditor.updateDom();
    }
  }
  function upHandler(e) {
    that.isDragging = false;
    that.updateClassName();
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

    that.dom.style.width  = Math.max(width, MIN_WIDTH)   + 'px';
    that.dom.style.height = Math.max(height, MIN_HEIGHT) + 'px';
    e.preventDefault();
    e.stopPropagation();
  }
  function upHandler(e) {
    stickynotes.doc.removeEventListener('mouseup'  , upHandler  , true);
    stickynotes.doc.removeEventListener('mousemove', moveHandler, true);
    that.width  = parseInt(that.dom.style.width);
    that.height = parseInt(that.dom.style.height) + 7;
    that.onResizeEnd();
    e.preventDefault();
    e.stopPropagation();
  }
};

function getAncestorNonContainer(elem) {
  for (let e = elem; e !== null; e = e.parentNode) {
    if (e.tagName === 'A' || e.tagName === 'IMG') {
      return e;
    }
  }
  return null;
};

stickynotes.StickyView.prototype.getContainerElement = function(elem) {
  if (!this.isValidTarget(elem)) return null;
  for (let e = elem; e.tagName !== 'BODY'; e = e.parentNode) {
    const tagName = e.tagName;
    if (tagName === 'BODY') {
      return e;
    }
    if (tagName !== 'A' && tagName !== 'IMG') {
      const a = getAncestorNonContainer(e);
      if (a === null) {
        return e;
      }
      e = a.parentNode;
    }
  }
  return null;
};

stickynotes.StickyView.prototype.isValidTarget = function(elem) {
  return this._isValidTarget(elem, this.dom);
};

stickynotes.StickyView.prototype._isValidTarget = function(elem, dom) {
  if (elem === dom) {
    return false;
  }
  if (!dom.hasChildNodes()) {
    return true;
  }
  for (let i = 0; i < dom.childNodes.length; i++) {
    if (!this._isValidTarget(elem, dom.childNodes[i])) {
      return false;
    }
  }
  return true;
};

stickynotes.addClass = function(elem, className) {
  if (!elem.className || !elem.className.split) {
    return;
  }
  let classes = elem.className.split(' ');
  classes.push(className);
  elem.className = classes.join(' ');
};

stickynotes.removeClass = function(elem, className) {
  if (!elem.className || !elem.className.split) {
    return;
  }
  elem.className = elem.className.split(' ')
                                 .filter((c) => c !== className)
                                 .join(' ');
};

stickynotes.createLine = function(color, strokeStyle) {
  const ns          = 'http://www.w3.org/2000/svg';
  const strokeWidth = 2;
  const container   = stickynotes.doc.createElementNS(ns, 'svg');
  const path        = stickynotes.doc.createElementNS(ns, 'path');
  const d           = stickynotes.doc.documentElement;
  path.setAttribute('stroke',       color);
  path.setAttribute('stroke-width', strokeWidth);
  if (strokeStyle === 'dot') {
    path.setAttribute('stroke-dasharray', '5, 10');
  }
  container.appendChild(path);
  container.style.position = 'absolute';
  container.style.zIndex   = 20000;
  container.className      = LINE;
  container.style.pointerEvents = 'none';
  return { path: path, container: container };
};


stickynotes.drawLineTo = function(x1, y1, x2, y2, margin, line) {
  const strokeWidth = 2;
  const w = Math.max(strokeWidth, Math.abs(x1 - x2) - margin);
  const h = Math.max(strokeWidth, Math.abs(y1 - y2) - margin);
  const l = Math.min(x1, x2) + (x1 > x2 ? 1 : -1) * margin;
  const t = Math.min(y1, y2) + (y1 > y2 ? 1 : -1) * margin;
  const sl = x1 > x2 ? margin : w;
  const dw = x1 > x2 ? (w - margin) : -(w - margin);
  const st = y1 > y2 ? margin : h;
  const dh = y1 > y2 ? (h - margin) : -(h - margin);

  line.path.setAttribute('d',
                         'M' + sl + ',' + st + ' l' + dw + ',' + dh + ' Z');

  const elem = line.container;
  elem.style.left   = l + 'px';
  elem.style.top    = t + 'px';
  elem.style.width  = w + 'px';
  elem.style.height = h + 'px';
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

stickynotes.StickyView.prototype.minimize = function() {
  this.sticky.state = stickynotes.StickyView.State.Minimized;
  this.updateClassName();
  this.statusUpdated();
  this.updateDom();
  this.hideDialog();
};

stickynotes.StickyView.prototype.maximize = function() {
  this.sticky.state = stickynotes.StickyView.State.Normal;
  this.updateClassName();
  this.statusUpdated();
  this.updateDom();
};

stickynotes.StickyView.prototype.toggleMenuDialog = function() {
  this.hideDialog();
  if (!this.dialog || this.dialog.className !== MENU_DIALOG) {
    this.showMenu();
  }
};

stickynotes.StickyView.prototype.toggleTagDialog = function() {
  this.hideDialog();
  if (!this.dialog || this.dialog.className !== TAGS_DIALOG) {
    this.showTagDialog();
  }
};

/**
 * toString
 * @return {String} string.
 */
stickynotes.StickyView.prototype.toString = function() {
  return 'sticky:' + this.sticky.uuid;
};

stickynotes.StickyView.search = function(key) {
  const URL      = stickynotes.doc.location.href;
  stickynotes.Page.fetchByUrl(URL).then((page) => {
    return stickynotes.Sticky.fetchByPage(page);
  }).then((stickies) => {
    for (var i = 0; i < stickies.length; i++) {
      var d = stickynotes.doc.getElementById('sticky' + stickies[i].iuud);
      if (stickies[i].filter(key)) d.style.visibility = 'visible';
      else                         d.style.visibility = 'hidden';
    }
  });
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

stickynotes.getElementXPath = function(element) {
  if (element && element.id) {
    return '//*[@id="' + element.id + '"]';
  } else {
    return stickynotes.getElementTreeXPath(element);
  }
};

stickynotes.getElementTreeXPath = function(e) {
  let paths = [];

  for (; e && e.nodeType == Node.ELEMENT_NODE; e = e.parentNode) {
    let index = 0;
    let hasFollowingSiblings = false;
    for (let s = e.previousSibling; s; s = s.previousSibling) {
      if (s.nodeType == Node.DOCUMENT_TYPE_NODE) {
        continue;
      }

      if (s.nodeName == e.nodeName)
        ++index;
    }

    for (let s = e.nextSibling; s && !hasFollowingSiblings; s = s.nextSibling) {
      if (s.nodeName == e.nodeName) {
        hasFollowingSiblings = true;
      }
    }

    var tagName = (e.prefix ? e.prefix + ':' : '') + e.localName;
    var pathIndex = (index || hasFollowingSiblings ? '[' + (index + 1) + ']' : '');
    paths.splice(0, 0, tagName + pathIndex);
  }

  return paths.length ? '/' + paths.join('/') : null;
};


stickynotes.StickyView.getElementsByXPath = function(xpath) {
  var elems = [];
  var iter = stickynotes.doc.evaluate(xpath,
                                      stickynotes.doc,
                                      null,
                                      XPathResult.ANY_TYPE,
                                      null);
  var elem = iter.iterateNext();
  if (elem) {
    elems.push(elem);
  }
  while (elem) {
    try {
      elem = iter.iterateNext();
      if (elem) {
        elems.push(elem);
      }
    } catch (e) {
      return elems;
    }
  }
  if (elems.length > 0) {
    return elems[0];
  }
  return null;
};
