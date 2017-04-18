var TAG_EDITOR = 'stickynotes-tag-editor';
var INPUT      = 'stickynotes-tag-editor-input';
var BTN        = 'stickynotes-button';
var DIALOG_BTN = 'stickynotes-tag-editor-button';
stickynotes.TagEditor = function(param) {
  this.items = param.items ? param.items : [];
  this.createDom();
  this.title = 'Tags';
  this.leftBarButtonClicked = param.leftBarButtonClicked;
  this.changed = (e) => {
    let names = this.splitToNames(this.input.value);
    if (param.changed) param.changed(names);
  };

  this.mousedownListener = (e) => { e.stopPropagation(); };
  this.keypressListener       = (e) => {
    if (e.keyCode === 13 /* enter */) {
      this.changed(e);
    }
  };
  this.bind();
};

stickynotes.TagEditor.prototype.createDom = function() {
  const doc = stickynotes.doc;
  this.dom                      = doc.createElement('div');
  this.input                    = doc.createElement('input');
  this.doneButton               = doc.createElement('button');
  this.cancelButton             = doc.createElement('div');
  this.dom.className            = TAG_EDITOR;
  this.input.className          = INPUT;
  this.doneButton.className     = [BTN, DIALOG_BTN].join(' ');
  this.doneButton.textContent   = 'Done';
  this.input.type               = 'text';
  this.input.value              = this.items.join(',');
  this.input.placeholder        = 'Separate tags with commas';

  this.dom.appendChild(this.input);
  this.dom.appendChild(this.doneButton);
};

stickynotes.TagEditor.prototype.bind = function() {
  const doc = stickynotes.doc;

  this.dom.addEventListener(   'mousedown', this.mousedownListener);
  this.input.addEventListener(  'keypress', this.keypressListener);
  this.doneButton.addEventListener('click', this.changed);
};

stickynotes.TagEditor.prototype.unbind = function() {
  this.dom.removeEventListener(   'mousedown', this.mousedownListener);
  this.input.removeEventListener(  'keypress', this.keypressListener);
  this.doneButton.removeEventListener('click', this.changed);
};

stickynotes.TagEditor.prototype.dispose = function() {
  this.unbind();
};

stickynotes.TagEditor.prototype.focus = function() {
  this.input.focus();
};

stickynotes.TagEditor.prototype.splitToNames = function(str) {
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
