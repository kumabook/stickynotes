/* global browser, ColorPicker, TagEditor, Dialog, StickyMenu */
function StickyView(param) {
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
  this.drag                  = this.drag.bind(this);
  this.onContentChange       = this.onContentChange.bind(this);
  this.onTextareaKeyDown     = this.onTextareaKeyDown.bind(this);

  this.createDom();
  this.updateDom();
  this.bind();
  this.isDragging = false;
}

StickyView.classes = {
  CLASS:           'stickynotes-sticky',
  MINIMIZED:       'stickynotes-sticky-minimized',
  DRAGGING:        'stickynotes-sticky-dragging',
  BUTTON:          'stickynotes-toolbar-button',
  BUTTON_ACTIVE:   'stickynotes-toolbar-button-active',
  DELETE_BUTTON:   'stickynotes-delete-button',
  EDIT_TAG_BUTTON: 'stickynotes-edit-tag-button',
  MINIMIZE_BUTTON: 'stickynotes-minimize-button',
  MENU_BUTTON:     'stickynotes-menu-button',
  TEXTAREA:        'stickynotes-textarea',
  TOOLBAR:         'stickynotes-toolbar',
  BAND:            'stickynotes-band',
  MENU_DIALOG:     'stickynotes-menu-dialog',
  TAGS_DIALOG:     'stickynotes-tags-dialog',
  RESIZE_SIZE:     35,
  MIN_WIDTH:       150,
  MIN_HEIGHT:      52,
};

StickyView.State = {
  Normal: 0,
  Deleted: 1,
  Minimized: 2
};

StickyView.colors = [
  { id: 'navy',    background: '#001f3f', font: '#ffffff'},
  { id: 'blue',    background: '#0074d9', font: '#ffffff'},
  { id: 'aqua',    background: '#7fdbff', font: '#000000'},
  { id: 'teal',    background: '#39cccc', font: '#000000'},
  { id: 'olive',   background: '#3d9970', font: '#ffffff'},
  { id: 'green',   background: '#2ecc40', font: '#ffffff'},
  { id: 'lime',    background: '#01ff70', font: '#000000'},
  { id: 'yellow',  background: '#f1c40f', font: '#000000'},
  { id: 'orange',  background: '#ff851b', font: '#000000'},
  { id: 'red',     background: '#ff4136', font: '#000000'},
  { id: 'maroon',  background: '#85144b', font: '#ffffff'},
  { id: 'fuchsia', background: '#f012be', font: '#ffffff'},
  { id: 'purple',  background: '#b10dc9', font: '#ffffff'},
  { id: 'black',   background: '#111111', font: '#ffffff'},
  { id: 'gray',    background: '#aaaaaa', font: '#000000'},
  { id: 'silver',  background: '#dddddd', font: '#000000'},
];

StickyView.getScrollOffset = function(elem, position) {
  var p = { left: 0, top: 0 };
  for (var n = elem.parentNode; n !== document; n = n.parentNode) {
    p.left += n.scrollLeft;
    p.top += n.scrollTop;
  }
  return p;
};

StickyView.deleteAll = function() {
  const c = StickyView.classes;
  const elements = document.getElementsByClassName(c.CLASS);
  for (let i = elements.length - 1; i >= 0; i--) {
    document.body.removeChild(elements[i]);
  }
};

StickyView.prototype.isMinimized = function() {
  return this.sticky.state === StickyView.State.Minimized;
};

/**
 * update dom element.
*/
StickyView.prototype.updateDom = function() {
  this.dom.style.left       = this.sticky.left   + 'px';
  this.dom.style.top        = this.sticky.top    + 'px';
  this.updateClassName();
  this.statusUpdated();
  const textarea            = this.textarea;
  textarea.value            = this.sticky.content;
  textarea.id               = 'sticky_id_' + this.sticky.id;
  textarea.placeholder      = browser.i18n.getMessage('sticky.placeholderText');
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

StickyView.prototype.updateClassName = function() {
  const c = StickyView.classes;
  const classNames = [c.CLASS];
  if (this.isMinimized()) {
    classNames.push(c.MINIMIZED);
  }
  if (this.isDragging) {
    classNames.push(c.DRAGGING);
  }
  this.dom.className = classNames.join(' ');
};

StickyView.prototype.statusUpdated = function() {
  var color = ColorPicker.getColorById(this.sticky.color);
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

StickyView.prototype.showMenu = function() {
  const c = StickyView.classes;
  this.hideDialog();
  this.dialog = new Dialog({ className: c.MENU_DIALOG});
  this.dialog.push(new StickyMenu({
    onSelectMenu: (item) => {
      switch (item.id) {
      case StickyMenu.Type.EditColor:
        var colorPicker = new ColorPicker({
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
      case StickyMenu.Type.PageOption:
        break;
      }
    },
    leftBarButtonClicked: () => { this.hideDialog(); }
  }));
  this.dom.appendChild(this.dialog.dom);
  this.dialog.dom.style.left = (this.sticky.width - 22) + 'px';
  this.dialog.dom.style.top = '32px';
  this.menuButton.className = [c.BUTTON,
                               c.BUTTON_ACTIVE,
                               c.MENU_BUTTON].join(' ');
};

StickyView.prototype.showTagDialog = function() {
  const c = StickyView.classes;
  this.hideDialog();
  this.dialog = new Dialog({ className: c.TAGS_DIALOG});
  const changed = (names) => {
    this.onTagsChange(names);
    this.hideDialog();
  };
  const tagEditor = new TagEditor({
    items: this.sticky.tags.map((tag) => { return tag.name; }),
    changed: changed,
    leftBarButtonClicked: () => { this.hideDialog(); }
  });
  this.dialog.push(tagEditor);
  this.dialog.dom.style.height = '120px';
  this.dom.insertBefore(this.dialog.dom, this.toolbar.nextSibling);
  this.dialog.dom.style.left = (this.sticky.width - 44) + 'px';
  this.dialog.dom.style.top = '32px';
  this.editTagButton.className = [c.BUTTON,
                                  c.BUTTON_ACTIVE,
                                  c.EDIT_TAG_BUTTON].join(' ');
  tagEditor.focus();
};


StickyView.prototype.hideDialog = function() {
  const c = StickyView.classes;
  if (this.dialog) {
    this.dom.removeChild(this.dialog.dom);
    this.dialog = null;
    this.menuButton.className    = [c.BUTTON, c.MENU_BUTTON].join(' ');
    this.editTagButton.className = [c.BUTTON, c.EDIT_TAG_BUTTON].join(' ');
    return;
  }
};

/**
 * remove dom element.
 */
StickyView.prototype.deleteDom = function() {
  this.unbind();
  document.body.removeChild(this.dom);
};
/**
 * create dom element.
 */
StickyView.prototype.createDom = function() {
  const c    = StickyView.classes;
  const that = this;
  const id   = 'sticky' + this.sticky.id;
  const doc  = document;
  this.dom = doc.createElement('div');
  this.dom.id = id;
  this.dom.__stickyView = this;

  this.textarea                 = doc.createElement('textarea');
  this.textarea.className       = c.TEXTAREA;
  this.toolbar                  = doc.createElement('div');
  this.toolbar.className        = c.TOOLBAR;
  this.deleteButton             = doc.createElement('div');
  this.deleteButton.className   = c.BUTTON + ' ' + c.DELETE_BUTTON;
  this.minimizeButton           = doc.createElement('div');
  this.minimizeButton.className = c.BUTTON + ' ' + c.MINIMIZE_BUTTON;
  this.editTagButton            = doc.createElement('button');
  this.editTagButton.className  = c.BUTTON + ' ' + c.EDIT_TAG_BUTTON;
  this.menuButton               = doc.createElement('div');
  this.menuButton.className     = c.BUTTON + ' ' + c.MENU_BUTTON;

  this.band                     = doc.createElement('div');
  this.band.className           = c.BAND;

  this.toolbar.appendChild(this.deleteButton);
  this.toolbar.appendChild(this.minimizeButton);
  this.toolbar.appendChild(this.menuButton);
  this.toolbar.appendChild(this.editTagButton);

  this.dom.appendChild(this.toolbar);
  this.dom.appendChild(this.textarea);
  this.dom.appendChild(this.band);

  this.maximize = this.maximize.bind(this);
};

StickyView.prototype.bind = function() {
  this.deleteButton.addEventListener(  'click', this.onClickDeleteButton);
  this.minimizeButton.addEventListener('click', this.onClickMinimizeButton);
  this.editTagButton.addEventListener( 'click', this.onClickEditTagButton);
  this.editTagButton.addEventListener( 'focus', this.onClickEditTagButton);
  this.menuButton.addEventListener(    'click', this.onClickMenuButton);

  this.textarea.addEventListener('change'   , this.onContentChange);
  this.textarea.addEventListener('keydown'  , this.onTextareaKeyDown);

  this.dom.addEventListener('mousedown', this.drag);
  this.dom.addEventListener( 'dblclick', this.maximize);
};

StickyView.prototype.unbind = function() {
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

StickyView.prototype.onContentChange = function() {
  if (this.sticky.content !== this.textarea.value) {
    this.onTextareaChange();
  }
};

StickyView.prototype.onTextareaKeyDown = function(e) {
  if (e.keyCode == 68 && e.ctrlKey && e.shiftKey) {
    e.target.sticky.remove();
  }
};

StickyView.prototype.getElementPosition = function(elem) {
  var position = elem.getBoundingClientRect();
  return {
    top:  Math.round(window.scrollY + position.top),
    left: Math.round(window.scrollX + position.left)
  };
};


/**
 * enable drag.
 * @param {Object} elem target element.
 * @param {e} e event.
 */
StickyView.prototype.drag = function(e) {
  const c      = StickyView.classes;
  const pos    = this.getElementPosition(this.dom);
  const right  = pos.left + parseInt(this.dom.style.width);
  const bottom = pos.top  + parseInt(this.dom.style.height);
  const offset  = StickyView.getScrollOffset(document.body);
  const clientX = e.clientX + offset.left;
  const clientY = e.clientY + offset.top;
  if ((right - c.RESIZE_SIZE < clientX  && clientX < right + c.RESIZE_SIZE) &&
      (bottom - c.RESIZE_SIZE < clientY && clientY < bottom + c.RESIZE_SIZE)) {
    this.hideDialog();
    this.resize(this.dom, e);
    return;
  }

  var elem   = this.dom;
  var that   = this;
  var URL    = document.location.href;
  var startX = e.clientX      , startY = e.clientY;
  var origX  = elem.offsetLeft, origY  = elem.offsetTop;
  var deltaX = startX - origX , deltaY = startY - origY;
  this.isDragging = true;
  this.updateClassName();
  document.addEventListener('mousemove', moveHandler, true);
  document.addEventListener('mouseup'  , upHandler  , true);
  e.stopPropagation();
  function moveHandler(e) {
    elem.style.left = (e.clientX - deltaX) + 'px';
    elem.style.top  = (e.clientY - deltaY) + 'px';
    e.stopPropagation();
    e.preventDefault();
  }
  function upHandler(e) {
    that.isDragging = false;
    that.updateClassName();
    document.removeEventListener('mouseup'  , upHandler  , true);
    document.removeEventListener('mousemove', moveHandler, true);
    that.onMoveEnd();
    e.stopPropagation();
    e.preventDefault();
  }
};
/**
 * enable drag resize.
 */
StickyView.prototype.resize = function(elem, e) {
  const c           = StickyView.classes;
  const that        = this;
  const startX      = e.clientX;
  const startY      = e.clientY;
  const origWidth   = parseInt(that.dom.style.width);
  const origHeight  = parseInt(that.dom.style.height);
  const deltaWidth  = startX - origWidth;
  const deltaHeight = startY - origHeight;
  document.addEventListener('mousemove', moveHandler, true);
  document.addEventListener('mouseup'  , upHandler  , true);
  e.stopPropagation();
  e.preventDefault();
  function moveHandler(e) {
    const width  = e.clientX - deltaWidth;
    const height = e.clientY - deltaHeight;

    that.dom.style.width  = `${Math.max(width, c.MIN_WIDTH)}px`;
    that.dom.style.height = `${Math.max(height, c.MIN_HEIGHT)}px`;
    e.preventDefault();
    e.stopPropagation();
  }
  function upHandler(e) {
    document.removeEventListener('mouseup'  , upHandler  , true);
    document.removeEventListener('mousemove', moveHandler, true);
    that.width  = parseInt(that.dom.style.width, 10);
    that.height = parseInt(that.dom.style.height, 10) + 7;
    that.onResizeEnd();
    e.preventDefault();
    e.stopPropagation();
  }
};
/**
 * focus to sticky.
 */
StickyView.prototype.focus = function() {
  this.textarea.focus();
};

StickyView.prototype.isEditing = function() {
  return document.activeElement === this.textarea;
};

StickyView.prototype.minimize = function() {
  this.sticky.state = StickyView.State.Minimized;
  this.updateClassName();
  this.statusUpdated();
  this.updateDom();
  this.hideDialog();
};

StickyView.prototype.maximize = function() {
  this.sticky.state = StickyView.State.Normal;
  this.updateClassName();
  this.statusUpdated();
  this.updateDom();
};

StickyView.prototype.toggleMenuDialog = function() {
  const c = StickyView.classes;
  this.hideDialog();
  if (!this.dialog || this.dialog.className !== c.MENU_DIALOG) {
    this.showMenu();
  }
};

StickyView.prototype.toggleTagDialog = function() {
  const c = StickyView.classes;
  this.hideDialog();
  if (!this.dialog || this.dialog.className !== c.TAGS_DIALOG) {
    this.showTagDialog();
  }
};

StickyView.prototype.isChanged = function(sticky) {
  const keys = ['left', 'top', 'width', 'height', 'content', 'color', 'state'];
  return keys.some(key => this.sticky[key] !== sticky[key]);
};

/**
 * toString
 * @return {String} string.
 */
StickyView.prototype.toString = function() {
  return 'sticky:' + this.sticky.id;
};

StickyView.search = function(key) {
  const URL      = document.location.href;
  Page.fetchByUrl(URL).then((page) => {
    return Sticky.fetchByPage(page);
  }).then((stickies) => {
    for (var i = 0; i < stickies.length; i++) {
      var d = document.getElementById('sticky' + stickies[i].iuud);
      if (stickies[i].filter(key)) d.style.visibility = 'visible';
      else                         d.style.visibility = 'hidden';
    }
  });
};
StickyView.toggleVisibilityAllStickies = function() {
  const isVisible = StickyView.StickiesVisibility;
  const c = StickyView.classes;
  const elements = document.getElementsByClassName(c.CLASS);
  for (let i = 0; i < elements.length; i += 1) {
    const e = elements[i];
    if (isVisible) {
      e.style.visibility = 'hidden';
    } else {
      e.style.visibility = 'visible';
    }
  }
  StickyView.StickiesVisibility = !isVisible;
  return !isVisible;
};

StickyView.deleteDom = function(sticky) {
  const dom = document.getElementById(`sticky${sticky.id}`);
  if (dom && dom.__stickyView) {
    dom.__stickyView.sticky = sticky;
    dom.__stickyView.deleteDom();
  }
};

StickyView.updateDom = function(sticky, { force } = { force: false }) {
  const e = document.getElementById(`sticky${sticky.id}`);
  if (!e) {
    return;
  }
  const view = e.__stickyView;
  if (force) {
    view.sticky = sticky;
    view.updateDom();
    return;
  }
  if (view.isChanged(sticky)) {
    const str = 'Current editing sticky is updated. Do you update the sticky?';
    if (view.isEditing() && !confirm(str)) {
      return;
    }
    view.sticky = sticky;
    view.updateDom();
  }
};

StickyView.updateColor = function(sticky) {
  let dom = document.getElementById(`sticky${sticky.id}`);
  if (dom && dom.__stickyView) {
    dom.__stickyView.statusUpdated();
  }
};

StickyView.StickiesVisibility = true;

