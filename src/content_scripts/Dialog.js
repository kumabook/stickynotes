function Dialog(param) {
  this.className = param.className;
  this.createDom();
  this.views = [];
  this.bind();
}

Dialog.classes = {
  DIALOG:     'stickynotes-dialog',
  NAVBAR:     'stickynotes-navbar',
  TITLE:      'stickynotes-navbar-title',
  BAR_BUTTON: 'stickynotes-navbar-bar-button',
  CONTENT:    'stickynotes-dialog-content',
  ICON:       'stickynotes-icon',
};

Dialog.prototype.createDom = function() {
  const c                = Dialog.classes;
  this.dom               = document.createElement('div');
  this.navbar            = document.createElement('div');
  this.content           = document.createElement('div');
  this.title             = document.createElement('div');
  this.leftBarButton     = document.createElement('div');
  this.dom.className     = [c.DIALOG, this.className].join(' ');
  this.navbar.className  = c.NAVBAR;
  this.content.className = c.CONTENT;
  this.navbar.appendChild(this.leftBarButton);
  this.navbar.appendChild(this.title);
  this.dom.appendChild(this.navbar);
  this.dom.appendChild(this.content);
};

Dialog.prototype.bind = function() {
  this.unbind();
  this.mousedownListener = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  this.dom.addEventListener('mousedown', this.mousedownListener);
  this.leftBarButtonClicked = () => {
    const v = this.views[this.views.length - 1];
    if (v.leftBarButtonClicked) {
      v.leftBarButtonClicked();
    }
  };
  this.leftBarButton.addEventListener('click', this.leftBarButtonClicked);
};

Dialog.prototype.unbind = function() {
  if (this.mousedownListener) {
    this.dom.removeEventListener('mousedown', this.mousedownListener);
    this.mousedownListener = null;
  }
  this.leftBarButton.removeEventListener('click', this.leftBarButtonClicked);
};

Dialog.prototype.updateNavbar = function() {
  const c = Dialog.classes;
  if (this.views.length === 0) return;
  const view = this.views[this.views.length - 1];
  this.title.className         = c.TITLE;
  this.title.textContent       = view.title;
  const classes = [c.BAR_BUTTON];
  if (this.views.length === 1) classes.push(c.ICON + '-close');
  else                         classes.push(c.ICON + '-back');
  this.leftBarButton.className = classes.join(' ');
};

Dialog.prototype.push = function(view) {
  if (this.views.length > 0) {
    this.content.removeChild(this.views[this.views.length - 1].dom);
  }
  this.views.push(view);
  this.content.appendChild(view.dom);
  this.updateNavbar();
};

Dialog.prototype.pop = function() {
  const previous = this.views.pop();
  if (previous) {
    this.content.removeChild(previous.dom);
  }
  const view = this.views[this.views.length - 1];
  this.content.appendChild(view.dom);
  this.updateNavbar();
};

Dialog.prototype.onMouseDown = function(e) {
  e.stopPropagation();
  e.preventDefault();
};

export default Dialog;
