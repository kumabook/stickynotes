var COLOR_PICKIER = 'stickynotes-color-picker';
var ITEM          = 'stickynotes-color-picker-item';

stickynotes.ColorPicker = function(param) {
  this.title = 'Edit Color';
  this.items = JSON.parse(JSON.stringify(stickynotes.ColorPicker.colors));
  this.createDom();
  this.bind();
  this.leftBarButtonClicked = param.leftBarButtonClicked;
  this.itemClicked = param.itemClicked;
};

stickynotes.ColorPicker.colors = [
  { id: 'navy',    background: '#001f3f', font: '#ffffff'},
  { id: 'blue',    background: '#0074d9', font: '#ffffff'},
  { id: 'aqua',    background: '#7fdbff', font: '#000000'},
  { id: 'teal',    background: '#39cccc', font: '#000000'},
  { id: 'olive',   background: '#3d9970', font: '#ffffff'},
  { id: 'green',   background: '#2ecc40', font: '#ffffff'},
  { id: 'lime',    background: '#01ff70', font: '#000000'},
  { id: 'yellow',  background: '#ffdc00', font: '#000000'},
  { id: 'orange',  background: '#ff851b', font: '#000000'},
  { id: 'red',     background: '#ff4136', font: '#000000'},
  { id: 'maroon',  background: '#85144b', font: '#ffffff'},
  { id: 'fuchsia', background: '#f012be', font: '#ffffff'},
  { id: 'purple',  background: '#b10dc9', font: '#ffffff'},
  { id: 'black',   background: '#111111', font: '#ffffff'},
  { id: 'gray',    background: '#aaaaaa', font: '#000000'},
  { id: 'silver',  background: '#dddddd', font: '#000000'}
];

stickynotes.ColorPicker.getColorById = function(id) {
  var maybe = stickynotes.ColorPicker.colors.filter((item) => {
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
