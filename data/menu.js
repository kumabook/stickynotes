var sidebarMenu, toggleMenu, createMenu;
var strings;
var check = '&#10004;';
window.onload = function() {
  sidebarMenu =  document.getElementById('sidebar-menu');
  sidebarMenu.addEventListener('click', function() {
    self.port.emit('sidebar-menu');
  }, true);
  toggleMenu =  document.getElementById('toggle-menu');
  toggleMenu.addEventListener('click', function() {
    self.port.emit('toggle-menu');
  }, true);
  createMenu =  document.getElementById('create-menu');
  createMenu.addEventListener('click', function() {
    self.port.emit('create-menu');
  }, true);
};

var updateMenuLabel = function() {
  sidebarMenu.innerHTML = (sidebarMenu.enabled ? check : '') +
    strings['show_sticky_list.label'];
  toggleMenu.innerHTML = (toggleMenu.enabled ? check : '') +
    strings['stickyToggleMenu.label'];
  createMenu.innerHTML = (createMenu.enabled ? check : '') +
    strings['stickyMenu.label'];
}

self.port.on('strings', function(_strings) {
  strings = _strings;
  updateMenuLabel();
});

self.port.on('sidebar-menu', function(enabled) {
  sidebarMenu.enabled = enabled;
  updateMenuLabel();
});

self.port.on('toggle-menu', function(enabled) {
  toggleMenu.enabled = enabled;
  updateMenuLabel();
});
