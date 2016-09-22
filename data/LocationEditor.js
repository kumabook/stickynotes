var LOCATION_EDITOR = 'stickynotes-location-editor';
var X_INPUT         = 'stickynotes-location-editor-x-input';
var Y_INPUT         = 'stickynotes-location-editor-y-input';
var MODE_SELECTION  = 'stickynotes-location-editor-mode-selection';
var LOCATION_ICON   = 'stickynotes-location-editor-icon';
var XPATH_INPUT     = 'stickynotes-location-editor-xpath-input';
var TARGET          = 'stickynotes-target';

stickynotes.LocationEditor = function(param) {
  this.items = param.items ? param.items : [];
  this.stickyView = param.stickyView;
  this.target = this.stickyView.target;
  this.onPinStart = param.onPinStart;
  this.onPinMove = param.onPinMove;
  this.onPinEnd = param.onPinEnd;
  this.createDom();
  this.title = 'Location';
  this.leftBarButtonClicked = param.leftBarButtonClicked;
  this.changed = (e) => {
    let names = this.splitToNames(this.input.value);
    if (param.changed) param.changed(names);
  };

  this.mousedownListener = (e) => { e.stopPropagation(); };
  this.pin = this.pin.bind(this);
  this.bind();
  this.updateDom();
};

stickynotes.LocationEditor.prototype.createDom = function() {
  const doc = stickynotes.doc;
  this.dom            = doc.createElement('div');
  this.modeSelection  = doc.createElement('div');
  this.fixedOption    = doc.createElement('input');
  this.fixedLabel     = doc.createElement('label');
  this.relativeOption = doc.createElement('input');
  this.relativeLabel  = doc.createElement('label');

  this.xInput         = doc.createElement('input');
  this.yInput         = doc.createElement('input');

  this.icon           = doc.createElement('div');
  this.xpath          = doc.createElement('input');

  var id = 'stickynotes-location-mode';
  this.modeSelection.id = id;
  this.modeSelection.className = MODE_SELECTION;

  this.fixedOption.id = id + '-fixed';
  this.fixedOption.setAttribute('type', 'radio');
  this.fixedOption.setAttribute('name', id);
  this.fixedOption.setAttribute('value', 'fixed');
  this.fixedLabel.setAttribute('for', this.fixedOption.id);
  this.fixedLabel.textContent = 'fixed';

  this.relativeOption.id = id + '-relative';
  this.relativeOption.setAttribute('type', 'radio');
  this.relativeOption.setAttribute('name', id);
  this.relativeOption.setAttribute('value', 'relative');
  this.relativeLabel.setAttribute('for', this.relativeOption.id);
  this.relativeLabel.textContent = 'relative';

  this.xInput.setAttribute('type', 'number');
  this.xInput.className = X_INPUT;
  this.yInput.setAttribute('type', 'number');
  this.yInput.className = Y_INPUT;

  this.icon.className  = [LOCATION_ICON, 'stickynotes-toolbar-button'].join(' ');
  this.xpath.className = XPATH_INPUT;

  this.dom.className = LOCATION_EDITOR;
  this.dom.appendChild(this.modeSelection);
  this.dom.appendChild(this.xInput);
  this.dom.appendChild(this.yInput);
  this.dom.appendChild(this.icon);
  this.dom.appendChild(this.xpath);

  this.modeSelection.appendChild(this.fixedOption);
  this.modeSelection.appendChild(this.fixedLabel);
  this.modeSelection.appendChild(this.relativeOption);
  this.modeSelection.appendChild(this.relativeLabel);
};

stickynotes.LocationEditor.prototype.updateDom = function() {
  this.xInput.value = this.stickyView.sticky.left;
  this.yInput.value = this.stickyView.sticky.top;
  const target = this.stickyView.sticky.target;
  this.xpath.value = target ? target : '';
};

stickynotes.LocationEditor.prototype.bind = function() {
  const doc = stickynotes.doc;

  this.dom.addEventListener(   'mousedown', this.mousedownListener);
  this.icon.addEventListener(   'mousedown', this.pin);
};

stickynotes.LocationEditor.prototype.unbind = function() {
  this.dom.removeEventListener(   'mousedown', this.mousedownListener);
  this.icon.removeEventListener(   'mousedown', this.pin);
};

stickynotes.LocationEditor.prototype.pin = function(e) {
  e.preventDefault();
  e.stopPropagation();
  const that   = this;
  const URL    = stickynotes.doc.location.href;
  const startX = e.clientX      , startY = e.clientY;
  const mover  = stickynotes.createLine('#FF4500');
  const d      = stickynotes.doc.documentElement;
  const rect   = that.icon.getBoundingClientRect();

  stickynotes.doc.body.appendChild(mover.container);
  this.onPinStart();
  stickynotes.doc.addEventListener('mousemove', moveHandler, true);
  stickynotes.doc.addEventListener('mouseup'  , upHandler  , true);
  e.stopPropagation();
  function moveHandler(e) {
    e.stopPropagation();
    e.preventDefault();
    that.onPinMove();
    if (that.target) {
      stickynotes.removeClass(that.target, TARGET);
    }
    const offset  = stickynotes.getScrollOffset(stickynotes.doc.body);
    const clientX = e.clientX + offset.left;
    const clientY = e.clientY + offset.top;
    const x       = (rect.x + offset.left + 11);
    const y       = (rect.y + offset.top + 11);
    const margin  = 4;
    const elem    = stickynotes.doc.elementFromPoint(e.clientX, e.clientY);
    if (that.stickyView.isValidTarget(elem)) {
      that.target = elem;
    } else {
      that.target = that.stickyView.dom.parentNode;
    }
    stickynotes.drawLineTo(x, y, clientX, clientY, margin, mover);
    if (that.target) {
      stickynotes.addClass(that.target, TARGET);
    }
  }

  function upHandler(e) {
    that.stickyView.updateClassName();
    stickynotes.doc.body.removeChild(mover.container);
    stickynotes.doc.removeEventListener('mouseup'  , upHandler  , true);
    stickynotes.doc.removeEventListener('mousemove', moveHandler, true);
    e.stopPropagation();
    e.preventDefault();
    that.onPinEnd(that.target);
    that.updateDom();
  }
};

function getAncestorNonContainer(elem) {
  for (let e = elem; e !== null; e = e.parentNode) {
    if (e.tagName === 'A' || e.tagName === 'IMG') {
      return e;
    }
  }
  return null;
};
