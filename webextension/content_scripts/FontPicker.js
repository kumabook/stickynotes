/* global StickyMenu */

function FontPicker(param) {
  this.title = 'Sticky Menu';
  this.items = [{
    id:    StickyMenu.Type.EditColor,
    label: 'Edit Color',
    icon:  'color',
  }, {
    id:    StickyMenu.Type.EditFont,
    label: 'Edit Font',
    icon:  'font',
  }/*, {
       id: stickynotes.StickyMenu.Type.PageOption,
    label: 'Page Option',
     icon: 'page-option'
  }*/];
  this.onSelectItem         = param.onSelectItem;
  this._onSelectItem        = this._onSelectItem.bind(this);
  this.leftBarButtonClicked = param.leftBarButtonClicked;
  this.createDom();
  this.bind();
}

FontPicker.classes = {
  FONT_ITEM: 'stickynotes-font-item',
};

FontPicker.prototype.createDom = function() {
  this.dom = document.createElement('div');
  this.dom.className = StickyMenu.classes.MENU;
  this.items.forEach((item) => {
    item.dom = this.createMenuItem(item);
    this.dom.appendChild(item.dom);
  });
};

FontPicker.prototype.createItem = function(item) {
  const dom        = document.createElement('div');
  const link       = document.createElement('a');
  dom.id           = item.id;
  dom.className    = FontPicker.classes.FONT_ITEM;
  link.textContent = item.label;
  dom.appendChild(link);
  return dom;
};

FontPicker.prototype._onSelectItem = function(e) {
  e.stopPropagation();
  e.preventDefault();
  const id = e.target.id || e.target.parentNode.id;
  this.items.forEach((item) => {
    if (id === item.id) {
      this.onSelectMenu(item);
    }
  });
};

FontPicker.prototype.onMouseDown = function(e) {
  e.stopPropagation();
  e.preventDefault();
};

FontPicker.prototype.bind = function() {
  this.items.forEach((item) => {
    item.dom.addEventListener('mousedown', this.onMouseDown);
    item.dom.addEventListener('click', this._onSelectMenu);
  });
};

FontPicker.prototype.unbind = function() {
  this.items.forEach((item) => {
    item.dom.addEventListener('mousedown', this.onMouseDown);
    item.dom.removeEventListener('click' , this._onSelectMenu);
  });
};

FontPicker.prototype.dispose = function() {
  this.unbind();
};
