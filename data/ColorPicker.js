var COLOR_PICKIER = 'stickynotes-color-picker';
var ITEM          = 'stickynotes-color-picker-item';

stickynotes.ColorPicker = function(param) {
  this.title = 'Edit Color';
  this.items = JSON.parse(JSON.stringify(stickynotes.colors));
  this.createDom();
  this.bind();
  this.leftBarButtonClicked = param.leftBarButtonClicked;
  this.itemClicked = param.itemClicked;
};

stickynotes.ColorPicker.getColorById = function(id) {
  var maybe = stickynotes.colors.filter((item) => {
    return item.id === id;
  });
  if (maybe.length > 0) return maybe[0];
  return null;
};

stickynotes.ColorPicker.prototype.createDom = function() {
  const doc = stickynotes.doc;
  this.dom = doc.createElement('div');
  this.dom.className = COLOR_PICKIER;
  this.items.forEach((item) => {
    const d = doc.createElement('div');
    d.className             = ITEM;
    d.style.backgroundColor = item.background;
    item.dom                = d;
    this.dom.appendChild(d);
  });
};

stickynotes.ColorPicker.prototype.bind = function() {
  const doc = stickynotes.doc;
  this.items.forEach((item) => {
    item.listener = (e) => {
      this.itemClicked(item);
    };
    item.dom.addEventListener('click', item.listener);
  });
};

stickynotes.ColorPicker.prototype.unbind = function() {
  const doc = stickynotes.doc;
  this.items.forEach((item) => {
    item.dom.removeEventListener('click', item.listener);
    item.listener = null;
  });
};
