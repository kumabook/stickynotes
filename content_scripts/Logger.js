const LEVEL = {
  TRACE: 0,
  DEBUG: 1,
  INFO:  2,
  WARN:  3,
  ERROR: 4,
  FATAL: 5,
};

const Logger = {
  LEVEL: LEVEL,
  level: LEVEL.FATAL,
  setLevel: (newLevel) => {
    if (LEVEL[newLevel] !== undefined) {
      Logger.level = LEVEL[newLevel];
    } else {
      Logger.level = newLevel;
    }
  },
  fatal: (msg) => {
    if (Logger.level <= LEVEL.FATAL) {
      console.error(msg);
    }
  },
  error: (msg) => {
    if (Logger.level <= LEVEL.ERROR) {
      console.error(msg);
    }
  },
  warn: (msg) => {
    if (Logger.level <= LEVEL.WARN) {
      console.warn(msg);
    }
  },
  info: (msg) => {
    if (Logger.level <= LEVEL.INFO) {
      console.info(msg);
    }
  },
  debug: (msg) => {
    if (Logger.level <= LEVEL.DEBUG) {
      console.debug(msg);
    }
  },
  trace: (msg) => {
    if (Logger.level <= LEVEL.TRACE) {
      console.log(msg);
    }
  },
};
