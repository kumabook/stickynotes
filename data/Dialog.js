var DIALOG     = 'stickynotes-dialog';
var NAVBAR     = 'stickynotes-navbar';
var TITLE      = 'stickynotes-navbar-title';
var BAR_BUTTON = 'stickynotes-navbar-bar-button';
var CONTENT    = 'stickynotes-dialog-content';
var ICON       = 'stickynotes-icon';
stickynotes.Dialog = function(param) {
  this.createDom();
  this.views = [];
  this.bind();
};

stickynotes.Dialog.prototype.createDom = function() {
  var doc                = stickynotes.doc;
  this.dom               = doc.createElement('div');
  this.navbar            = doc.createElement('div');
  this.content           = doc.createElement('div');
  this.title             = doc.createElement('div');
  this.leftBarButton     = doc.createElement('div');
  this.dom.className     = DIALOG;
  this.navbar.className  = NAVBAR;
  this.content.className = CONTENT;
  this.navbar.appendChild(this.leftBarButton);
  this.navbar.appendChild(this.title);
  this.dom.appendChild(this.navbar);
  this.dom.appendChild(this.content);
};

stickynotes.Dialog.prototype.bind = function() {
  this.unbind();
  this.mousedownListener = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  this.dom.addEventListener('mousedown', this.mousedownListener);
  this.leftBarButtonClicked = () => {
    let v = this.views[this.views.length - 1];
    if (v.leftBarButtonClicked) {
      v.leftBarButtonClicked();
    }
  };
  this.leftBarButton.addEventListener('click', this.leftBarButtonClicked);
};

stickynotes.Dialog.prototype.unbind = function() {
  this.dom.removeEventListener('mousedown', this.mousedownListener);
  this.leftBarButton.removeEventListener('click', this.leftBarButtonClicked);
};

stickynotes.Dialog.prototype.updateNavbar = function() {
  if (this.views.length === 0) return;
  var view = this.views[this.views.length - 1];
  this.title.className         = TITLE;
  this.title.textContent       = view.title;
  var classes = [BAR_BUTTON];
  if (this.views.length === 1) classes.push(ICON + '-close');
  else                         classes.push(ICON + '-back');
  this.leftBarButton.className = classes.join(' ');
};

stickynotes.Dialog.prototype.push = function(view) {
  if (this.views.length > 0) {
    this.content.removeChild(this.views[this.views.length - 1].dom);
  }
  this.views.push(view);
  this.content.appendChild(view.dom);
  this.updateNavbar();
};

stickynotes.Dialog.prototype.pop = function() {
  var previous = this.views.pop();
  if (previous) {
    this.content.removeChild(previous.dom);
  }
  var view = this.views[this.views.length - 1];
  this.content.appendChild(view.dom);
  this.updateNavbar();
};

stickynotes.Dialog.prototype.onMouseDown = function(e) {
  e.stopPropagation();
  e.preventDefault();
};

