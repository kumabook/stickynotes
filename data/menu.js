window.onload = function() {
  var sidebarMenu =  document.getElementById('sidebar-menu');
  sidebarMenu.addEventListener('click', function() {
    self.port.emit('sidebar-menu');
  }, true);
  var toggleMenu =  document.getElementById('toggle-menu');
  toggleMenu.addEventListener('click', function() {
    self.port.emit('toggle-menu');
  }, true);
  var createMenu =  document.getElementById('create-menu');
  createMenu.addEventListener('click', function() {
    self.port.emit('create-menu');
  }, true);
};
