if (!stickynotes) {
  var stickynotes = require('./stickynotes');
  var prefService = require("sdk/preferences/service");
  var {Cc,Ci} = require('chrome');
}
stickynotes.Shortcut = function(params) {
  this.name = params.name;
  this.action = params.action;
  this.label = params.label;
  this.default = params.default;
  Object.defineProperty(this, 'combo', {
    get: function() { return this._getCombo(); }
  });
  Object.defineProperty(this, 'key', {
    set: function(val) { this.save('key', val); },
    get: function() { return this.load('key'); }
  });
  Object.defineProperty(this, 'modifiers', {
    set: function(val) { this.save('modifiers', val); },
    get: function() { return this.load('modifiers'); }
  });
};
stickynotes.Shortcut.prototype.prefix = "extensions.stickynotes.shortcut.";

stickynotes.Shortcut.prototype._getCombo = function() {
  var combo = '';
  for (var i = 0; i < this.modifiers.length; i++) {
    combo += this.modifiers[i] + '-';
  }
  combo += this.key;
  return combo;
};

stickynotes.Shortcut.prototype.save = function(type, value) {
  prefService.set(this.prefix + this.name + '.' + type,
                  JSON.stringify(value));
};

stickynotes.Shortcut.prototype.load = function(type) {
  return JSON.parse(
    prefService.get(this.prefix + this.name + '.' + type,
                    JSON.stringify(this.default[type])));
};

stickynotes.Shortcut.prototype.update = function(keyEvent) {
  var key = '', modifiers = [];

//  if (keyEvent.keyCode > 0 && keyEvent.keyCode < 130) {
    key = this.keyFromCharCode(keyEvent.keyCode);
//  }

  if (keyEvent.ctrlKey) {
    modifiers.push('control');
  }
  if (keyEvent.altKey) {
    modifiers.push('alt');
  }
  if (keyEvent.metaKey) {
    modifiers.push('meta');
  }
  if (keyEvent.shiftKey) {
    modifiers.push('shift');
  }

  if (modifiers.length === 0 || key.length === 0) {
    return false;
  }
  this.key = key;
  this.modifiers = modifiers;
  return true;
};
stickynotes.Shortcut.prototype.keyFromCharCode = function(charCode) {
  var key = String.fromCharCode(charCode).toLowerCase();
  if (charCode == 8) key = "backspace"; //  backspace
  if (charCode == 9) key = "tab"; //  tab
  if (charCode == 13) key = "enter"; //  enter
  if (charCode == 16) key = "shift"; //  shift
  if (charCode == 17) key = "ctrl"; //  ctrl
  if (charCode == 18) key = "alt"; //  alt
  if (charCode == 19) key = "pause/break"; //  pause/break
  if (charCode == 20) key = "caps lock"; //  caps lock
  if (charCode == 27) key = "escape"; //  escape
  if (charCode == 33) key = "page up"; // page up, to avoid displaying alternate character and confusing people
  if (charCode == 34) key = "page down"; // page down
  if (charCode == 35) key = "end"; // end
  if (charCode == 36) key = "home"; // home
  if (charCode == 37) key = "left arrow"; // left arrow
  if (charCode == 38) key = "up arrow"; // up arrow
  if (charCode == 39) key = "right arrow"; // right arrow
  if (charCode == 40) key = "down arrow"; // down arrow
  if (charCode == 45) key = "insert"; // insert
  if (charCode == 46) key = "delete"; // delete
  if (charCode == 91) key = "left window"; // left window
  if (charCode == 92) key = "right window"; // right window
  if (charCode == 93) key = "select key"; // select key
  if (charCode == 96) key = "numpad 0"; // numpad 0
  if (charCode == 97) key = "numpad 1"; // numpad 1
  if (charCode == 98) key = "numpad 2"; // numpad 2
  if (charCode == 99) key = "numpad 3"; // numpad 3
  if (charCode == 100) key = "numpad 4"; // numpad 4
  if (charCode == 101) key = "numpad 5"; // numpad 5
  if (charCode == 102) key = "numpad 6"; // numpad 6
  if (charCode == 103) key = "numpad 7"; // numpad 7
  if (charCode == 104) key = "numpad 8"; // numpad 8
  if (charCode == 105) key = "numpad 9"; // numpad 9
  if (charCode == 106) key = "multiply"; // multiply
  if (charCode == 107) key = "add"; // add
  if (charCode == 109) key = "subtract"; // subtract
  if (charCode == 110) key = "decimal point"; // decimal point
  if (charCode == 111) key = "divide"; // divide
  if (charCode == 112) key = "F1"; // F1
  if (charCode == 113) key = "F2"; // F2
  if (charCode == 114) key = "F3"; // F3
  if (charCode == 115) key = "F4"; // F4
  if (charCode == 116) key = "F5"; // F5
  if (charCode == 117) key = "F6"; // F6
  if (charCode == 118) key = "F7"; // F7
  if (charCode == 119) key = "F8"; // F8
  if (charCode == 120) key = "F9"; // F9
  if (charCode == 121) key = "F10"; // F10
  if (charCode == 122) key = "F11"; // F11
  if (charCode == 123) key = "F12"; // F12
  if (charCode == 144) key = "num lock"; // num lock
  if (charCode == 145) key = "scroll lock"; // scroll lock
  if (charCode == 186) key = ";"; // semi-colon
  if (charCode == 187) key = "="; // equal-sign
  if (charCode == 188) key = ","; // comma
  if (charCode == 189) key = "-"; // dash
  if (charCode == 190) key = "."; // period
  if (charCode == 191) key = "/"; // forward slash
  if (charCode == 192) key = "`"; // grave accent
  if (charCode == 219) key = "["; // open bracket
  if (charCode == 220) key = "\\"; // back slash
  if (charCode == 221) key = "]"; // close bracket
  if (charCode == 222) key = "'"; // single quote  var lblCharCode = getO
  return key;
};
module.exports = stickynotes.Shortcut;
