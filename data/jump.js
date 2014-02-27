self.port.on('focus', function(sticky) {
  var elem = document.getElementById('sticky_id_' + sticky.id);
  if (elem) {
    elem.focus();
  }
});
self.port.on('transition', function(url) {
  document.location.href = url;
});
self.postMessage(document.location.href);
