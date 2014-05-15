/**
 *  @fileoverview stickynotes.js.
 *
 * @author Hiroki Kumamoto
 * @version 1.0.0
 */
/**
  @const namespace for stickynotes addon.
 */
const stickynotes = {
    x: 0,
    y: 0,
    loaded: 0
};
stickynotes.DBHelper = require('./DBHelper');
stickynotes.Sticky = require('./Sticky');
stickynotes.Page = require('./Page');
stickynotes.Tag = require('./Tag');
stickynotes.Shortcut = require('./Shortcut');

module.exports = stickynotes;
