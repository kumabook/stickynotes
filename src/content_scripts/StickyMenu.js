function StickyMenu(param) {
  this.title = 'Sticky Menu';
  this.items = [{
    id:    StickyMenu.Type.EditColor,
    label: 'Edit Color',
    icon:  'color'
  }/*, {
       id: stickynotes.StickyMenu.Type.PageOption,
    label: 'Page Option',
     icon: 'page-option'
  }*/];
  this.onSelectMenu         = param.onSelectMenu;
  this._onSelectMenu        = this._onSelectMenu.bind(this);
  this.leftBarButtonClicked = param.leftBarButtonClicked;
  this.createDom();
  this.bind();
}

StickyMenu.classes = {
  MENU:      'stickynotes-menu',
  MENU_ITEM: 'stickynotes-menu-item',
  MENU_ICON: 'stickynotes-menu-icon',
  ICON:      'stickynotes-icon',
};

StickyMenu.Type = {
  EditColor: 'color',
  PageOption: 'page-option'
};

StickyMenu.prototype.createDom = function() {
  const c  = StickyMenu.classes;
  this.dom = document.createElement('div');
  this.dom.className = c.MENU;
  this.items.forEach((item) => {
    item.dom = this.createMenuItem(item);
    this.dom.appendChild(item.dom);
  });
};

StickyMenu.prototype.createMenuItem = function(item) {
  const c          = StickyMenu.classes;
  const dom        = document.createElement('div');
  const icon       = document.createElement('div');
  const link       = document.createElement('a');
  dom.id           = item.id;
  dom.className    = c.MENU_ITEM;
  link.textContent = item.label;
  icon.className   = c.MENU_ICON + ' ' + c.ICON + '-' + item.id;
  dom.appendChild(icon);
  dom.appendChild(link);
  return dom;
};

StickyMenu.prototype._onSelectMenu = function(e) {
  e.stopPropagation();
  e.preventDefault();
  const id = e.target.id || e.target.parentNode.id;
  this.items.forEach((item) => {
    if (id === item.id) {
      this.onSelectMenu(item);
    }
  });
};

StickyMenu.prototype.onMouseDown = function(e) {
  e.stopPropagation();
  e.preventDefault();
};

StickyMenu.prototype.bind = function() {
  this.items.forEach((item) => {
    item.dom.addEventListener('mousedown', this.onMouseDown);
    item.dom.addEventListener('click', this._onSelectMenu);
  });
};

StickyMenu.prototype.unbind = function() {
  this.items.forEach((item) => {
    item.dom.addEventListener('mousedown', this.onMouseDown);
    item.dom.removeEventListener('click', this._onSelectMenu);
  });
};

export default StickyMenu;
