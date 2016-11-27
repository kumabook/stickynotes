var stickynotes = require('./stickynotes');
if (!stickynotes.prefService) {
  stickynotes.prefService = require("sdk/preferences/service");
}
stickynotes.Color = function(params) {
  this.id = params.id;
  this.background = params.background;
  this.font = params.font;
  this.default = { background: this.background, font: this.font };
  Object.defineProperty(this, 'background', {
    set: function(val) { this.save('background', val); },
    get: function() { return this.load('background'); }
  });
  Object.defineProperty(this, 'font', {
    set: function(val) { this.save('font', val); },
    get: function() { return this.load('font'); }
  });
};
stickynotes.Color.prototype.prefix = "extensions.stickynotes.color.";

stickynotes.Color.prototype.save = function(type, value) {
  stickynotes.prefService.set(this.prefix + this.id  + '.' + type,
                              JSON.stringify(value));
};

stickynotes.Color.prototype.load = function(type) {
  return JSON.parse(
    stickynotes.prefService.get(this.prefix + this.id + '.' + type,
                                JSON.stringify(this.default[type])));
};

stickynotes.Color.prototype.restoreDefault = function() {
  this.background = this.default.background;
  this.font = this.default.font;
};

stickynotes.Color.prototype.toJSON = function() {
  return {
    id: this.id,
    background: this.background,
    font: this.font,
    default: this.default
  };
};

module.exports = stickynotes.Color;
