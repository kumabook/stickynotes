var stickynotes = require('./stickynotes');

var LEVEL = {
    TRACE: 0,
    DEBUG: 1,
     INFO: 2,
     WARN: 3,
    ERROR: 4,
    FATAL: 5
};
var level = 0;
stickynotes.Logger = {
  LEVEL: LEVEL,
  setLevel: function(newLevel) {
    if (LEVEL[newLevel] !== undefined) {
      level = LEVEL[newLevel];
    } else {
      level = newLevel;
    }
  },
  fatal: function(msg) { if (level <= LEVEL.FATAL) console.error(msg); },
  error: function(msg) { if (level <= LEVEL.ERROR) console.error(msg); },
  warn:  function(msg) { if (level <= LEVEL.WARN)  console.warn(msg);  },
  info:  function(msg) { if (level <= LEVEL.INFO)  console.info(msg);  },
  debug: function(msg) { if (level <= LEVEL.DEBUG) console.debug(msg); },
  trace: function(msg) { if (level <= LEVEL.TRACE) console.log(msg);   }
};
module.exports = stickynotes.Logger;
