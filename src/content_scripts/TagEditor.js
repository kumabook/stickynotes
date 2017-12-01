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
  this.keypressListener  = (e) => {
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

TagEditor.prototype.createDom = function createDom() {
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

TagEditor.prototype.bind = function bind() {
  this.dom.addEventListener('mousedown', this.mousedownListener);
  this.input.addEventListener('keypress', this.keypressListener);
  this.doneButton.addEventListener('click', this.changed);
};

TagEditor.prototype.unbind = function unbind() {
  this.dom.removeEventListener('mousedown', this.mousedownListener);
  this.input.removeEventListener('keypress', this.keypressListener);
  this.doneButton.removeEventListener('click', this.changed);
};

TagEditor.prototype.dispose = function dispose() {
  this.unbind();
};

TagEditor.prototype.focus = function focus() {
  this.input.focus();
};

TagEditor.prototype.splitToNames = function splitToNames(str) {
  /* eslint-disable no-irregular-whitespace  */
  const tagsStr = `${str},`.replace(/^[\s　]+|[\s　]+$/g, '');
  const tags     = [];
  let tagList      = (tagsStr).split(',');
  tagList = tagList.slice(0, tagList.length - 1);
  for (let i = 0; i < tagList.length; i += 1) {
    tagList[i] = tagList[i].replace(/^[\s　]+|[\s　]+$/g, '');
    if (tagList[i] !== '') { // remove blank str
      let isUnique = true;
      for (let j = 0; j < tags.length; j += 1) { // remove duplicated str
        if (tags[j] === tagList[i]) {
          isUnique = false;
        }
      }
      if (isUnique) {
        tags.push(tagList[i]);
      }
    }
  }
  return tags;
};

export default TagEditor;
