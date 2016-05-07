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
  { id: 'blue',       value: '#0079BF'},
  { id: 'yellow',     value: '#D29034'},
  { id: 'green',      value: '#519839'},
  { id: 'brown',      value: '#B04632'},
  { id: 'purple',     value: '#89609E'},
  { id: 'pink',       value: '#CD5A91'},
  { id: 'lightgreen', value: '#4BBF6B'},
  { id: 'skyblue',    value: '#00AECC'},
  { id: 'gray',       value: '#838C91'}
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
    d.style.backgroundColor = item.value;
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
