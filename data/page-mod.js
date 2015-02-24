var logger = {
  fatal: function(msg) {},
  error: function(msg) {},
  warn:  function(msg) {},
  info:  function(msg) {},
  debug: function(msg) {},
  trace: function(msg) {}
};

stickynotes.MARKER_ID = 'stickynotes-marker';
stickynotes.doc = document;
stickynotes.isAlreadyLoaded = function() {
  return document.getElementById(this.MARKER_ID) !== null;
};

stickynotes.markAsLoaded = function() {
  logger.trace('setup stickynotes for ' + document.location.href);
  stickynotes.marker       = document.createElement('meta');
  stickynotes.marker.id    = 'stickynotes-marker';
  stickynotes.marker.style = 'display: none;';
  stickynotes.head         = document.head;
  stickynotes.head.appendChild(stickynotes.marker);
};

var onStrings = function(_strings) {
  stickynotes.strings = _strings;
};

var onCreateSticky = function(sticky) {
  logger.trace('create-sticky');
  sticky.left = stickynotes.x;
  sticky.top = stickynotes.y;
  var stickyView = stickynotes.createStickyView(sticky);
  document.body.appendChild(stickyView.dom);
  stickynotes.saveSticky(sticky);
  stickynotes.x += 10;
  stickynotes.y += 10;
};

var onDeleteSticky = function(sticky) {
  logger.trace('page-mod: delete-sticky ' + sticky.id);
  stickynotes.StickyView.deleteDom(sticky);
};

var onJumpSticky = function(message) {
  logger.trace('page-mod: jump-sticky');
};

var onFocusSticky = function(sticky) {
  setTimeout(function() {
    document.getElementById('sticky_id_' + sticky.id).focus();
  }, 500);
};
var load = function(stickies) {
  stickies.forEach(function(s) {
    var view = stickynotes.createStickyView(s);
    document.body.appendChild(view.dom);
  });
};
var onLoadStickies = function(stickies) {
  load(stickies);
  logger.trace('page-mod: load-stickies: count=' + stickies.length);
};

var onToggleVisibility = function(stickies) {
  var enabled = stickynotes.StickyView.toggleVisibilityAllStickies(stickies);
  self.port.emit('toggle-menu', enabled);
};

var onImport = function(stickies) {
  logger.trace('page-mod: imported ' + stickies.length + ' stickies.');
  load(stickies);
};

var watchClickPosition = function(event) {
  try {
    stickynotes.x = event.clientX + window.content.pageXOffset;
    stickynotes.y = event.clientY + window.content.pageYOffset;
  } catch (e) {
    logger.trace(e);
  }
};

if (!stickynotes.isAlreadyLoaded()) {
  stickynotes.markAsLoaded();
  self.port.on('strings',           onStrings);
  self.port.on('create-sticky',     onCreateSticky);
  self.port.on('delete-sticky',     onDeleteSticky);
  self.port.on('jump-sticky',       onJumpSticky);
  self.port.on('focus-sticky',      onFocusSticky);
  self.port.on('load-stickies',     onLoadStickies);
  self.port.on('toggle-visibility', onToggleVisibility);
  self.port.on('import',            onImport);
  document.addEventListener('mousedown', watchClickPosition, false);

  self.port.once('detach', function() {
    self.port.removeListener('create-sticky',     onCreateSticky);
    self.port.removeListener('delete-sticky',     onDeleteSticky);
    self.port.removeListener('jump-sticky',       onJumpSticky);
    self.port.removeListener('focus-sticky',      onFocusSticky);
    self.port.removeListener('load-stickies',     onLoadStickies);
    self.port.removeListener('toggle-visibility', onToggleVisibility);
    self.port.removeListener('import',            onImport);
    stickynotes.head.removeChild(stickynotes.marker);
    stickynotes.doc.removeEventListener('mousedown', watchClickPosition, false);
    stickynotes.StickyView.deleteAll();

  });
}
