var DIALOG = 'stickynotes-dialog';
var DIALOG_NAVBAR = 'stickynotes-dialog-navbar';
var DIALOG_CONTENT = 'stickynotes-dialog-content';
stickynotes.Dialog = function(param) {
  this.createDom();
  this.bind();
};

stickynotes.Dialog.prototype.createDom = function() {
  var doc                = stickynotes.doc;
  this.dom               = doc.createElement('div');
  this.navbar            = doc.createElement('div');
  this.content           = doc.createElement('div');
  this.dom.className     = DIALOG;
  this.navbar.className  = DIALOG_NAVBAR;
  this.content.className = DIALOG_CONTENT;
  this.dom.appendChild(this.navbar);
  this.dom.appendChild(this.content);
};

stickynotes.Dialog.prototype.pushContent = function(view) {
  this.navbar.textContent = view.title;
  this.dom.appendChild(view.dom);
};

stickynotes.Dialog.prototype.onMouseDown = function(e) {
  e.stopPropagation();
  e.preventDefault();
};

stickynotes.Dialog.prototype.bind = function() {
};

stickynotes.Dialog.prototype.unbind = function() {
};
