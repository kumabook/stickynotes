var sidebarMenu, toggleMenu, createMenu, preferenceMenu;
var strings;
const checkChar = '✔';
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
  preferenceMenu =  document.getElementById('preference-menu');
  preferenceMenu.addEventListener('click', function() {
    self.port.emit('preference-menu');
  }, true);
};

var updateMenuLabel = function() {
  sidebarMenu.textContent = (sidebarMenu.enabled ? checkChar : '') +
    strings['show_sticky_list.label'];
  toggleMenu.textContent = (toggleMenu.enabled ? checkChar : '') +
    strings['stickyToggleMenu.label'];
  createMenu.textContent = (createMenu.enabled ? checkChar : '') +
    strings['stickyMenu.label'];
  preferenceMenu.textContent = (preferenceMenu.enabled ? checkChar : '') +
    strings['preferenceMenu.label'];
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
