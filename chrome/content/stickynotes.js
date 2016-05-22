/**
  @const namespace for stickynotes addon.
 */
const __stickynotes = {
  x: 0,
  y: 0,
  loaded: 0
};
__stickynotes.Cc = Components.classes;
__stickynotes.Ci = Components.interfaces;
__stickynotes.Cu = Components.utils;
var require = function(path) {
  if (path === './stickynotes') {
    return __stickynotes;
  }
  return {};
};
var module = {};
