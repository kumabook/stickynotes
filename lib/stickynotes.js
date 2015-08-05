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

    Object.defineProperty(stickynotes, 'lastSynced', {
      get: function() {
        var str = prefService.get(stickynotes.prefix + 'lastSynced', null);
        if (str) {
          return new Date(str);
        } else {
          return new Date(0);
        }
      },
      set: function(val) {
        if (val) {
          prefService.set(stickynotes.prefix + 'lastSynced', val.toJSON());
        } else {
          prefService.reset(stickynotes.prefix + 'lastSynced');
        }
      }
    });
    /* set default */
    if (stickynotes.lastSynced === null) {
      stickynotes.lastSynced = 0;
    }
  }
};
stickynotes.DBHelper = require('./DBHelper');
stickynotes.ApiClient = require('./ApiClient');
stickynotes.Sticky = require('./Sticky');
stickynotes.Page = require('./Page');
stickynotes.Tag = require('./Tag');
stickynotes.Shortcut = require('./Shortcut');
stickynotes.init();

module.exports = stickynotes;
