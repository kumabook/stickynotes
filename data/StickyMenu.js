var MENU      = 'stickynotes-menu';
var MENU_ITEM = 'stickynotes-menu-item';
var MENU_ICON = 'stickynotes-menu-icon';
var ICON      = 'stickynotes-icon';
stickynotes.StickyMenu = function(param) {
  this.title = 'Sticky Menu';
  this.items = [{
       id: stickynotes.StickyMenu.Type.EditColor,
    label: 'Edit Color',
     icon: 'color'
  }, {
       id: stickynotes.StickyMenu.Type.PageOption,
    label: 'Page Option',
     icon: 'page-option'
  }];
  this.onSelectMenu         = param.onSelectMenu;
  this._onSelectMenu        = this._onSelectMenu.bind(this);
  this.leftBarButtonClicked = param.leftBarButtonClicked;
  this.createDom();
  this.bind();
};

stickynotes.StickyMenu.Type = {
  EditColor: 'color',
  PageOption: 'page-option'
};

stickynotes.StickyMenu.prototype.createDom = function() {
  var doc = stickynotes.doc;
  this.dom = doc.createElement('div');
  this.dom.className = MENU;
  this.items.forEach((item) => {
    item.dom = this.createMenuItem(item);
    this.dom.appendChild(item.dom);
  });
};

stickynotes.StickyMenu.prototype.createMenuItem = function(item) {
  var doc          = stickynotes.doc;
  var dom          = doc.createElement('div');
  var icon         = doc.createElement('div');
  var link         = doc.createElement('a');
  dom.id           = item.id;
  dom.className    = MENU_ITEM;
  link.textContent = item.label;
  icon.className   = MENU_ICON + ' ' + ICON + '-' + item.id;
  dom.appendChild(icon);
  dom.appendChild(link);
  return dom;
};

stickynotes.StickyMenu.prototype._onSelectMenu = function(e) {
  e.stopPropagation();
  e.preventDefault();
  var id = e.target.id || e.target.parentNode.id;
  this.items.forEach((item) => {
    if (id === item.id) {
      this.onSelectMenu(item);
    }
  });
};

stickynotes.StickyMenu.prototype.onMouseDown = function(e) {
  e.stopPropagation();
  e.preventDefault();
};

stickynotes.StickyMenu.prototype.bind = function() {
  this.items.forEach((item) => {
    item.dom.addEventListener('mousedown', this.onMouseDown);
    item.dom.addEventListener('click', this._onSelectMenu);
  });
};

stickynotes.StickyMenu.prototype.unbind = function() {
  var doc = stickynotes.doc;
  this.items.forEach((item) => {
    item.dom.addEventListener('mousedown', this.onMouseDown);
    item.dom.removeEventListener('click', this._onSelectMenu);
  });
};
