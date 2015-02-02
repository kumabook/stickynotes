stickynotes.MARKER_ID = 'stickynotes-marker';
stickynotes.isAlreadyLoaded = function() {
  return document.getElementById(this.MARKER_ID) !== null;
};

stickynotes.markAsLoaded = function() {
  console.log('setup stickynotes for ' + document.location.href);
  var isEventAddedElem   = document.createElement('meta');
  isEventAddedElem.id    = 'stickynotes-marker';
  isEventAddedElem.style = 'display: none;';
  document.head.appendChild(isEventAddedElem);
};

var onStrings = function(_strings) {
  stickynotes.strings = _strings;
};

var onCreateSticky = function(sticky) {
  console.log('create-sticky');
  sticky.left = stickynotes.x;
  sticky.top = stickynotes.y;
  var stickyView = stickynotes.createStickyView(sticky);
  document.body.appendChild(stickyView.dom);
  stickynotes.saveSticky(sticky);
  stickynotes.x += 10;
  stickynotes.y += 10;
};

var onDeleteSticky = function(sticky) {
  console.log('page-mod: delete-sticky ' + sticky.id);
  stickynotes.StickyView.deleteDom(sticky);
};

var onJumpSticky = function(message) {
  console.log('page-mod: jump-sticky');
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
  console.log('page-mod: load-stickies: count=' + stickies.length);
};

var onToggleVisibility = function(stickies) {
  var enabled = stickynotes.StickyView.toggleVisibilityAllStickies(stickies);
  self.port.emit('toggle-menu', enabled);
};

var onImport = function(stickies) {
  console.log('page-mod: imported ' + stickies.length + ' stickies.');
  load(stickies);
};

var watchClickPosition = function(event) {
  try {
    stickynotes.x = event.clientX + window.content.pageXOffset;
    stickynotes.y = event.clientY + window.content.pageYOffset;
  } catch (e) {
    console.log(e);
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
    stickynotes.StickyView.deleteAll();
    var marker = document.getElementById(stickynotes.MARKER_ID);
    document.head.removeChild(marker);
    try {
      document.removeEventListener('mousedown', watchClickPosition, false);
    } catch (e) {
      console.log(e);
    }
  });
}
