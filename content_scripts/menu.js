var menu,
    login,
    sidebarMenu,
    toggleMenu,
    createMenu,
    searchMenu,
    displayOptionMenu,
    preferenceMenu,
    importMenu,
    exportMenu,
    syncMenu,
    loginMenu,
    logoutMenu,
    back,
    loginButton,
    userInput,
    passwordInput,
    signup,
    resetPassword;
var filePicker;
var strings;
var isLoggedIn = false;
const checkChar = '✔';
const logger         = {
  fatal: function(msg) {},
  error: function(msg) {},
  warn:  function(msg) {},
  info:  function(msg) {},
  debug: function(msg) {},
  trace: function(msg) {}
};

function getExtention(fileName) {
  if (!fileName) {
    return null;
  }
  var fileTypes = fileName.split(".");
  var len = fileTypes.length;
  if (len === 0) {
    return null;
  }
  return fileTypes[len - 1];
}

window.onload = function() {
  menu = document.getElementById('menu');
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
  searchMenu = document.getElementById('search-menu');
  searchMenu.addEventListener('click', function() {
    self.port.emit('search-menu');
  }, true);
  displayOptionMenu = document.getElementById('display-option-menu');
  displayOptionMenu.addEventListener('click', function() {
    self.port.emit('display-option-menu');
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
      var isJSON = file.type == 'application/json' ||
                   getExtention(file.name) === 'json';
      logger.trace('import ' + file.name + ' ' + file.type);
      if (isJSON) {
        var reader = new FileReader();
        reader.onload = function(event) {
          try {
            logger.trace(reader.result);
            var data = JSON.parse(reader.result);
            self.port.emit('import-menu', data);
          } catch (e) {
            logger.trace('failed to import:' + e);
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
  syncMenu = document.getElementById('sync-menu');
  syncMenu.addEventListener('click', function() {
    self.port.emit('sync-menu');
  }, true);
  loginMenu = document.getElementById('login-menu');
  loginMenu.addEventListener('click', function() {
    showLogin();
  }, true);
  logoutMenu = document.getElementById('logout-menu');
  logoutMenu.addEventListener('click', function() {
    self.port.emit('logout-menu');
  }, true);
  preferenceMenu = document.getElementById('preference-menu');
  preferenceMenu.addEventListener('click', function() {
    self.port.emit('preference-menu');
  }, true);

  login = document.getElementById('login');
  loginButton = document.getElementById('login-button');
  loginButton.addEventListener('click', function() {
    self.port.emit('login-menu', userInput.value, passwordInput.value);
  });
  back = document.getElementById('back-to-menu');
  back.addEventListener('click', function() {
    showMenu();
  });
  userInput = document.getElementById('user-input');
  userInput.addEventListener('keypress', function(e) {
    if (e.keyCode === 13 /* enter */) {
      passwordInput.focus();
    }
  });
  passwordInput = document.getElementById('password-input');
  passwordInput.addEventListener('keypress', function(e) {
    if (e.keyCode === 13 /* enter */) {
      self.port.emit('login-menu', userInput.value, passwordInput.value);
    }
  });
  signup = document.getElementById('signup');
  signup.addEventListener('click', function() {
    self.port.emit('signup');
  });
  resetPassword = document.getElementById('reset-password');
  resetPassword.addEventListener('click', function() {
    self.port.emit('reset-password');
  });
};

var showMenu = function() {
  menu.style.display = '';
  login.style.display = 'none';
};

var showLogin = function() {
  menu.style.display = 'none';
  login.style.display = '';
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
  searchMenu.textContent = strings['stickySearchMenu.label'];
  displayOptionMenu.textContent = strings['stickyDisplayOptionMenu.label'];
  preferenceMenu.textContent = (preferenceMenu.enabled ? checkChar : '') +
    strings['preferenceMenu.label'];

  if (isLoggedIn) {
    loginMenu.parentNode.style.display = 'none';
    logoutMenu.parentNode.style.display = '';
    syncMenu.parentNode.style.display = '';
  } else {
    loginMenu.parentNode.style.display = '';
    logoutMenu.parentNode.style.display = 'none';
    syncMenu.parentNode.style.display = 'none';
  }
  showMenu();
};

var downloadAsFile = function(fileName, content) {
  logger.trace(fileName);
  logger.trace(content);
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

self.port.on('update', function(data) {
  strings = data.strings;
  isLoggedIn = data.isLoggedIn;
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
  logger.trace(stickies);
  var fileName = 'stickynotes_' + name + '.json';
  downloadAsFile(fileName, JSON.stringify(stickies));
});
