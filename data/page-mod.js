var LEVEL = {
    TRACE: 0,
    DEBUG: 1,
     INFO: 2,
     WARN: 3,
    ERROR: 4,
    FATAL: 5
};
var level = LEVEL.FATAL;
var logger = {
  LEVEL: LEVEL,
  setLevel: function(newLevel) {
    if (LEVEL[newLevel] !== undefined) {
      level = LEVEL[newLevel];
    } else {
      level = newLevel;
    }
  },
  fatal: function(msg) { if (level <= LEVEL.FATAL) console.error(msg); },
  error: function(msg) { if (level <= LEVEL.ERROR) console.error(msg); },
  warn:  function(msg) { if (level <= LEVEL.WARN)  console.warn(msg);  },
  info:  function(msg) { if (level <= LEVEL.INFO)  console.info(msg);  },
  debug: function(msg) { if (level <= LEVEL.DEBUG) console.debug(msg); },
  trace: function(msg) { if (level <= LEVEL.TRACE) console.log(msg);   }
};

stickynotes.MARKER_ID = 'stickynotes-marker';
stickynotes.doc = document;
stickynotes.window = window;
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

var isChildWindow = function() {
  return window !== window.parent;
};

var onCreateSticky = function(sticky, url) {
  if ((window.location && url !== window.location.href) || isChildWindow()) {
    return;
  }
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
  logger.trace('page-mod: delete-sticky ' + sticky.uuid);
  stickynotes.StickyView.deleteDom(sticky);
};

var onJumpSticky = function(message) {
  logger.trace('page-mod: jump-sticky');
};

var onFocusSticky = function(sticky) {
  setTimeout(function() {
    document.getElementById('sticky_id_' + sticky.uuid).focus();
  }, 500);
};

var load = function(stickies) {
  stickies.forEach(function(s) {
    if (s.state !== stickynotes.StickyView.State.Deleted) {
      var view = stickynotes.createStickyView(s);
      document.body.appendChild(view.dom);
    }
  });
};

var onLoadStickies = function(stickies, url) {
  if ((window.location && url !== window.location.href) || isChildWindow()) {
    return;
  }
  stickynotes.StickyView.deleteAll();
  load(stickies);
  logger.trace('page-mod: load-stickies: count=' + stickies.length);
};

var onHashChange = function(e) {
  logger.info('hashchange: ' + e.newURL);
  self.port.emit('reload-stickies', e.newURL);
};

var onPopState = function(e) {
  logger.info('popstate: ' + e.state + ', ' + document.location.href);
  self.port.emit('reload-stickies', document.location.href);
};


var onToggleVisibility = function(stickies) {
  var enabled = stickynotes.StickyView.toggleVisibilityAllStickies(stickies);
  self.port.emit('toggle-menu', enabled);
};

var onImport = function(createdStickies, updatedStickies) {
  logger.trace('page-mod: import stickies.');
  load(createdStickies);
  updatedStickies.forEach(function(sticky) {
    if (sticky.state === stickynotes.StickyView.State.Deleted) {
      stickynotes.StickyView.deleteDom(sticky);
    } else {
      stickynotes.StickyView.updateDom(sticky);
    }
  });
};

var watchClickPosition = function(event) {
  try {
    stickynotes.x = event.clientX + window.content.pageXOffset;
    stickynotes.y = event.clientY + window.content.pageYOffset;
  } catch (e) {
    logger.trace(e);
  }
};

var loadCSS = function(href) {
  logger.trace('loadCSS: ' + href);
  var head = document.getElementsByTagName('head')[0];
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.type = 'text/css';
  link.href = href;

  var links = head.getElementsByTagName('link');
  for(var i = 0; i < links.length; i++) {
    if(links[i].href == link.href) return false;
  }
  head.appendChild(link);
  return true;
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
  self.port.on('load-css',          loadCSS);

  document.addEventListener('mousedown', watchClickPosition, false);
  window.addEventListener('hashchange',  onHashChange);
  window.addEventListener('popstate',    onPopState);

  self.port.once('detach', function() {
    self.port.removeListener('create-sticky',     onCreateSticky);
    self.port.removeListener('delete-sticky',     onDeleteSticky);
    self.port.removeListener('jump-sticky',       onJumpSticky);
    self.port.removeListener('focus-sticky',      onFocusSticky);
    self.port.removeListener('load-stickies',     onLoadStickies);
    self.port.removeListener('toggle-visibility', onToggleVisibility);
    self.port.removeListener('import',            onImport);
    stickynotes.head.removeChild(stickynotes.marker);
    stickynotes.doc.removeEventListener('mousedown',     watchClickPosition, false);
//  stickynotes.window.removeEventListener('hashchange', onHashChange);
//  stickynotes.window.removeEventListener('popstate',   onPopState);
    stickynotes.StickyView.deleteAll();
  });
}
