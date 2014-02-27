self.port.on('create-sticky', function(sticky) {
  sticky.left = stickynotes.x;
  sticky.top = stickynotes.y;
  var stickyView = stickynotes.createStickyView(sticky);
  document.body.appendChild(stickyView.dom);
  stickynotes.saveSticky(sticky);
});
self.port.on('delete-sticky', function(message) {
  console.log('page-mod: delete-sticky');
});
self.port.on('jump-sticky', function(message) {
  console.log('page-mod: jump-sticky');
});
self.port.on('focus-sticky', function(sticky) {
  setTimeout(function() {
    document.getElementById('sticky_id_' + sticky.id).focus();
  }, 500);
});

self.port.on('load-stickies', function(stickies) {
  for (var i = 0; i < stickies.length; i++) {
    var stickyView = stickynotes.createStickyView(stickies[i]);
    document.body.appendChild(stickyView.dom);
  }
  console.log('page-mod: load-stickies: count=' + stickies.length);
});

self.port.on('toggle-visibility', function(stickies) {
  stickynotes.StickyView.toggleVisibilityAllStickies(stickies);
});


var watchClickPosition = function(event) {
  stickynotes.x = event.clientX + window.content.pageXOffset;
  stickynotes.y = event.clientY + window.content.pageYOffset;
  console.log('x:' + stickynotes.x + ' ,y:' + stickynotes.y);
};
document.addEventListener('mousedown',
                          watchClickPosition,
                          false);
