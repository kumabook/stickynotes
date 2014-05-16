/**
 *  @fileoverview stickynotes.js.
 *
 * @author Hiroki Kumamoto
 * @version 1.0.0
 */
/**
  @const namespace for stickynotes addon.
 */
const prefService = require("sdk/preferences/service");
const stickynotes = {
  x: 0,
  y: 0,
  loaded: 0,
  prefix: 'extensions.stickynotes.',
  init: function() {
    Object.defineProperty(stickynotes, 'needConfirmBeforeDelete', {
      get: function() {
        return prefService.get(stickynotes.prefix +
                               'needConfirmBeforeDelete', null);
      },
      set: function(val) {
        prefService.set(stickynotes.prefix +
                        'needConfirmBeforeDelete', val);
      }
    });
    /* set default */
    if (stickynotes.needConfirmBeforeDelete === null) {
      stickynotes.needConfirmBeforeDelete = true;
    }
  }
};
stickynotes.DBHelper = require('./DBHelper');
stickynotes.Sticky = require('./Sticky');
stickynotes.Page = require('./Page');
stickynotes.Tag = require('./Tag');
stickynotes.Shortcut = require('./Shortcut');
stickynotes.init();

module.exports = stickynotes;
