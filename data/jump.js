self.port.on('focus', function(sticky) {
  var elem = document.getElementById('sticky_id_' + sticky.uuid);
  if (elem) {
    elem.focus();
  }
});

self.postMessage(document.location.href);
