var sidebarMenu,
    toggleMenu,
    createMenu,
    preferenceMenu,
    importMenu,
    exportMenu;
var filePicker;
var strings;
const checkChar = '✔';
window.onload = function() {
  sidebarMenu = document.getElementById('sidebar-menu');
  sidebarMenu.addEventListener('click', function() {
    self.port.emit('sidebar-menu');
  }, true);
  toggleMenu = document.getElementById('toggle-menu');
  toggleMenu.addEventListener('click', function() {
    self.port.emit('toggle-menu');
  }, true);
  createMenu = document.getElementById('create-menu');
  createMenu.addEventListener('click', function() {
    self.port.emit('create-menu');
  }, true);
  importMenu = document.getElementById('import-menu');
  importMenu.addEventListener('click', function() {
    document.getElementById("file-picker").click();
  }, true);
  filePicker = document.getElementById('file-picker');
  filePicker.addEventListener('change', function(e) {
    var i;
    var files = e.target.files;
    for (i = 0; i < files.length; i++) {
      var file = files[i];
      console.log('import ' + file.name + ' ' + file.type);
      if (file.type == 'application/json') {
        var reader = new FileReader();
        reader.onload = function(event) {
          try {
            console.log(reader.result);
            var data = JSON.parse(reader.result);
            self.port.emit('import-menu', data);
          } catch (e) {
            console.log('failed to import:' + e);
          }
        };
        reader.readAsText(file);
      }
    }
  });

  exportMenu = document.getElementById('export-menu');
  exportMenu.addEventListener('click', function() {
    self.port.emit('export-menu');
  }, true);
  preferenceMenu = document.getElementById('preference-menu');
  preferenceMenu.addEventListener('click', function() {
    self.port.emit('preference-menu');
  }, true);
};

var updateMenuLabel = function() {
  importMenu.textContent = strings['stickyImportMenu.label'];
  exportMenu.textContent = strings['stickyExportMenu.label'];
  sidebarMenu.textContent = (sidebarMenu.enabled ? checkChar : '') +
    strings['show_sticky_list.label'];
  toggleMenu.textContent = (toggleMenu.enabled ? checkChar : '') +
    strings['stickyToggleMenu.label'];
  createMenu.textContent = (createMenu.enabled ? checkChar : '') +
    strings['stickyMenu.label'];
  preferenceMenu.textContent = (preferenceMenu.enabled ? checkChar : '') +
    strings['preferenceMenu.label'];
}

var downloadAsFile = function(fileName, content) {
  console.log(fileName);
  console.log(content);
  var blob = new Blob([content]);
  var url = window.URL;
  var blobURL = url.createObjectURL(blob);

  var a = document.createElement('a');
  a.download = fileName;
  a.href = blobURL;
  var event = document.createEvent( "MouseEvents" );
  event.initEvent("click", false, true);
  a.dispatchEvent(event);
};

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

self.port.on('export', function(stickies, name) {
  console.log(stickies);
  var fileName = 'stickynotes_' + name + '.json';
  downloadAsFile(fileName, JSON.stringify(stickies));
});
