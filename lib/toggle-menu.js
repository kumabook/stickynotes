const {Cc,Ci} = require('chrome');
const info    = Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULAppInfo);
const version = parseInt(info.version);
const panels  = require("sdk/panel");
const self    = require('sdk/self');

var ToggleMenu = function(params) {
  this.panel    = params.panel;
  this.onChange = params.onChange;
  if (version < 29) {
    this.createWidget();
  } else {
    this.createToggleButton();
  }
};

ToggleMenu.prototype.createWidget = function() {
  const widgets = require("sdk/widget");
  var widget = widgets.Widget({
    id: 'stickynotes-menu',
    label: 'stickynotes',
    contentURL: self.data.url('icon-64.png'),
    panel: this.panel
  });
};

ToggleMenu.prototype.createToggleButton = function() {
  const toggle  = require('sdk/ui/button/toggle');
  this.button = toggle.ToggleButton({
    id: 'stickynotes-menu',
    label: 'stickynotes',
    icon: {
      "16": self.data.url('icon-16.png'),
      "32": self.data.url('icon-32.png'),
      "64": self.data.url('icon-64.png')
    },
    onChange: this.onChange
  });
};


ToggleMenu.prototype.hide = function() {
  if (this.button) {
    this.button.state('window', {checked: false});
  }
};

module.exports = ToggleMenu;
