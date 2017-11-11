/* global StickyView */

function ColorPicker(param) {
  this.title = 'Edit Color';
  this.items = JSON.parse(JSON.stringify(StickyView.colors));
  this.createDom();
  this.bind();
  this.leftBarButtonClicked = param.leftBarButtonClicked;
  this.itemClicked = param.itemClicked;
}

ColorPicker.classes = {
  COLOR_PICKIER: 'stickynotes-color-picker',
  ITEM:          'stickynotes-color-picker-item',
};

ColorPicker.getColorById = (id) => {
  const maybe = StickyView.colors.filter(item => item.id === id);
  if (maybe.length > 0) return maybe[0];
  return null;
};

ColorPicker.prototype.createDom = function() {
  const c  = ColorPicker.classes;
  this.dom = document.createElement('div');
  this.dom.className = c.COLOR_PICKIER;
  this.items.forEach((item) => {
    const d = document.createElement('div');
    d.className             = c.ITEM;
    d.style.backgroundColor = item.background;
    item.dom                = d;
    this.dom.appendChild(d);
  });
};

ColorPicker.prototype.bind = function() {
  this.items.forEach((item) => {
    item.listener = () => {
      this.itemClicked(item);
    };
    item.dom.addEventListener('click', item.listener);
  });
};

ColorPicker.prototype.unbind = function() {
  this.items.forEach((item) => {
    item.dom.removeEventListener('click', item.listener);
    item.listener = null;
  });
};
