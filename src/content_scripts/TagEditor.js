function TagEditor(param) {
  this.items = param.items ? param.items : [];
  this.createDom();
  this.title = 'Tags';
  this.leftBarButtonClicked = param.leftBarButtonClicked;
  this.changed = () => {
    const names = this.splitToNames(this.input.value);
    if (param.changed) param.changed(names);
  };

  this.mousedownListener = (e) => { e.stopPropagation(); };
  this.keypressListener       = (e) => {
    if (e.keyCode === 13 /* enter */) {
      this.changed(e);
    }
  };
  this.bind();
}

TagEditor.classes = {
  TAG_EDITOR: 'stickynotes-tag-editor',
  INPUT:      'stickynotes-tag-editor-input',
  BTN:        'stickynotes-button',
  DIALOG_BTN: 'stickynotes-tag-editor-button',
};

TagEditor.prototype.createDom = function() {
  const c                       = TagEditor.classes;
  this.dom                      = document.createElement('div');
  this.input                    = document.createElement('input');
  this.doneButton               = document.createElement('button');
  this.cancelButton             = document.createElement('div');
  this.dom.className            = c.TAG_EDITOR;
  this.input.className          = c.INPUT;
  this.doneButton.className     = [c.BTN, c.DIALOG_BTN].join(' ');
  this.doneButton.textContent   = 'Done';
  this.input.type               = 'text';
  this.input.value              = this.items.join(',');
  this.input.placeholder        = 'Separate tags with commas';

  this.dom.appendChild(this.input);
  this.dom.appendChild(this.doneButton);
};

TagEditor.prototype.bind = function() {
  this.dom.addEventListener('mousedown', this.mousedownListener);
  this.input.addEventListener('keypress', this.keypressListener);
  this.doneButton.addEventListener('click', this.changed);
};

TagEditor.prototype.unbind = function() {
  this.dom.removeEventListener('mousedown', this.mousedownListener);
  this.input.removeEventListener('keypress', this.keypressListener);
  this.doneButton.removeEventListener('click', this.changed);
};

TagEditor.prototype.dispose = function() {
  this.unbind();
};

TagEditor.prototype.focus = function() {
  this.input.focus();
};

TagEditor.prototype.splitToNames = function(str) {
  const tags_str = `${str},`.replace(/^[\s　]+|[\s　]+$/g, '');
  const tags     = [];
  let _tags      = (tags_str).split(',');
  _tags = _tags.slice(0, _tags.length - 1);
  for (let i = 0; i < _tags.length; i++) {
    _tags[i] = _tags[i].replace(/^[\s　]+|[\s　]+$/g, '');
    if (_tags[i] !== '') {//remove blank str
      let isUnique = true;
      for (let j = 0; j < tags.length; j += 1) {//remove duplicated str
        if (tags[j] === _tags[i]) {
          isUnique = false;
        }
      }
      if (isUnique) {
        tags.push(_tags[i]);
      }
    }
  }
  return tags;
};

export default TagEditor;
