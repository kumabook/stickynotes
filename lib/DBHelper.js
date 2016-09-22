var stickynotes = require('./stickynotes');
if (!stickynotes.Cc || !stickynotes.Ci || !stickynotes.Cu) {
  let c = require('chrome');
  stickynotes.Cc = c.Cc;
  stickynotes.Ci = c.Ci;
  stickynotes.Cu = c.Cu;
}
/** @constructor My namespace's DBHelper */
stickynotes.DBHelper = {};
stickynotes.DBHelper.dbName = 'stickynotes';
stickynotes.DBHelper.uuid = function() {
  var Cc = stickynotes.Cc;
  var Ci = stickynotes.Ci;
  var name = "@mozilla.org/uuid-generator;1";
  var uuid = Cc[name].getService(Ci.nsIUUIDGenerator);
  return uuid.generateUUID().toString().substring(1, 37);
};

stickynotes.DBHelper.genId = function() {
  return Math.round(Math.random() * 0x7FFFFFFFFFFFFFFF);
};

stickynotes.DBHelper.connection = function() {
  const Cc = stickynotes.Cc;
  const Ci = stickynotes.Ci;
  const Cu = stickynotes.Cu;
  Cu.import("resource://gre/modules/Sqlite.jsm");
  const file = Cc['@mozilla.org/file/directory_service;1']
          .getService(Ci.nsIProperties)
          .get('ProfD', Ci.nsIFile);
  file.append(stickynotes.DBHelper.dbName + '.sqlite');
  return Sqlite.openConnection({
    path: file.path,
    sharedMemoryCache: true
  });
};

/**
 * create tables.
 */
stickynotes.DBHelper.createTables = function(c) {
  return c.execute('CREATE TABLE IF NOT EXISTS sticky(' +
                   'id INTEGER PRIMARY KEY , page_id INTEGER ,' +
                   'left INTEGER, top INTEGER, width INTEGER, ' +
                   'height INTEGER, content TEXT, color TEXT)')
    .then(() => c.execute('CREATE TABLE IF NOT EXISTS page(' +
                          'id INTEGER PRIMARY KEY , url TEXT UNIQUE,' +
                          'title TEXT)'))
    .then(() => c.execute('CREATE TABLE IF NOT EXISTS tag(' +
                          'id INTEGER PRIMARY KEY , name TEXT UNIQUE)'))
    .then(() => c.execute('CREATE TABLE IF NOT EXISTS sticky_tag(' +
                          'id INTEGER PRIMARY KEY ,' +
                          'sticky_id INTEGER, tag_id INTEGER)'))
    .then(() => c.execute('CREATE TABLE IF NOT EXISTS version(number INTEGER)'))
    .then(() => {
      stickynotes.Logger.trace('Created tables');
      return true;
    });
};
/**
 * drop tables.
 */
stickynotes.DBHelper.dropTables = function(c) {
  return c.execute('DROP TABLE IF EXISTS "sticky" ')
    .then(() => c.execute('DROP TABLE IF EXISTS "page" '))
    .then(() => c.execute('DROP TABLE IF EXISTS "tag" '))
    .then(() => c.execute('DROP TABLE IF EXISTS "sticky_tag" '))
    .then(() => c.execute('DROP TABLE IF EXISTS "version" '))
    .then(() => {
      stickynotes.Logger.trace('Drop tables');
      return true;
    });
};

stickynotes.DBHelper.getVersion = function(c) {
  const sql = 'SELECT * FROM version';
  return c.execute(sql).then((rs) => {
    if (rs.length) {
      return rs.map((r) => stickynotes.DBHelper.row2Obj(r, ['number']));
    } else {
      return [];
    }
  }).then((objs) => objs.map((v) => {
    return parseInt(v.number);
  })).then((versions) => {
    if (versions.length == 0) {
      return stickynotes.DBHelper.initVersion(c, 0);
    } else {
     return versions[versions.length - 1];
    }
  });
};

stickynotes.DBHelper.initVersion = function(c, number) {
  const sql = 'INSERT INTO version VALUES(:number)';
  const params = { number: number };
  return c.execute(sql, params).then(() => number);
};

stickynotes.DBHelper.updateVersion = function(c, number) {
  const sql = 'UPDATE version SET number=:number';
  const params = { number: number };
  return c.execute(sql, params);
};


stickynotes.DBHelper.targetVersion = 0;
stickynotes.DBHelper.migrate = function(c) {
  const targetVersion = stickynotes.DBHelper.targetVersion;
  return stickynotes.DBHelper.getVersion(c).then((currentVersion) => {
    let migrations = [];
    while (true) {
      if (currentVersion < targetVersion) {
        var up = stickynotes.DBHelper.migrates[currentVersion].up;
        currentVersion += 1;
        if (up) {
          migrations.push(up);
        }
      } else if (currentVersion > targetVersion) {
        var down = stickynotes.DBHelper.migrates[currentVersion-1].down;
        currentVersion -= 1;
        if (down) {
          migrations.push(down);
        }
      } else {
        stickynotes.Logger.trace(`There are ${migrations.length} migrations`);
        return migrations.reduce((p, m) => p.then(() => m(c)),
                                 Promise.resolve());
      }
    }
  }).then(() => stickynotes.DBHelper.updateVersion(c, targetVersion));
};
stickynotes.DBHelper.migrates = [];
stickynotes.DBHelper.migrates[0] = {
  up: function(c) {
    stickynotes.Logger.trace(`Executing migration 0`);
    return Promise.resolve()
      .then(() => c.execute('ALTER TABLE sticky ADD COLUMN uuid TEXT'))
      .then(() => c.execute('ALTER TABLE sticky ADD COLUMN user_id INTEGER'))
      .then(() => c.execute('ALTER TABLE sticky ADD COLUMN created_at TIMESTAMP'))
      .then(() => c.execute('ALTER TABLE sticky ADD COLUMN updated_at TIMESTAMP'))
      .then(() => c.execute('ALTER TABLE sticky ADD COLUMN is_deleted INTEGER DEFAULT 0'))
      .then(() => stickynotes.Sticky.fetchAll().then((stickies) => {
        return Promise.all(stickies.map((s) => {
          if (s.uuid) {
            return Promise.resolve(true);
          }
          const values = 'uuid=:uuid, created_at=:created_at, updated_at=:updated_at';
          const sql = 'UPDATE sticky SET ' + values + ' WHERE id=:id';
          const params = {
            id: s.id,
            uuid: stickynotes.DBHelper.uuid(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          return c.execute(sql, params);
        }));
      }));
  },
  down: function(c) {
    return Promise.resolve('do nothing');
  }
};

stickynotes.DBHelper.migrates[1] = {
  up: function(c) {
    stickynotes.Logger.trace(`Executing migration 1`);
    return Promise.resolve()
      .then(() => c.execute('ALTER TABLE sticky ADD COLUMN state INTEGER DEFAULT 0'))
      .then(() => stickynotes.DBHelper.execute('SELECT * FROM sticky'))
      .then(() => stickynotes.Sticky.fetchAll().then((rows) => {
        const keys = ['uuid', 'is_deleted'];
        const vals = rows.map((row) => stickynotes.DBHelper.row2Obj(row, keys));
        return Promise.all(vals.map((s) => {
          const values = 'state=:state';
          const sql = 'UPDATE sticky SET ' + values + ' WHERE uuid=:uuid';
          const params = {
            uuid: s.uuid,
            state: s.is_deleted
          };
          return c.execute(sql, params);
        }));
      }));
  },
  down: function(c) {
    return Promise.resolve('do nothing');
  }
};

stickynotes.DBHelper.migrates[2] = {
  up: function(c) {
    stickynotes.Logger.trace(`Executing migration 2`);
    return Promise.resolve()
      .then(() => c.execute('ALTER TABLE sticky ADD COLUMN target TEXT'))
      .then(() => stickynotes.DBHelper.execute('SELECT * FROM sticky'));
  },
  down: function(c) {
    return Promise.resolve('do nothing');
  }
};
stickynotes.DBHelper.targetVersion = stickynotes.DBHelper.migrates.length;
stickynotes.DBHelper.fetch = function(Class, sql, params = {}) {
  const DBHelper = stickynotes.DBHelper;
  const row2Obj  = DBHelper.row2Obj;
  const keys     = Class.keys;
  let c;
  let items;
  stickynotes.Logger.trace(`Execute SQL: ${sql} params: ${JSON.stringify(params)}`);
  return DBHelper.connection()
    .then((conn) => {
      c = conn;
      return c.execute(sql, params);
    }).then((rs) => {
      return rs.map((r) =>  new Class(row2Obj(r, keys)));
    }).then((_items) => {
      items = _items;
      return c.close();
    }).then(() => {
      return items ? items : [];
    }).catch((e) => {
      stickynotes.Logger.trace(`SQL Error: ${e}`);
      if (c) {
        return c.close().then(() => Promise.reject(e));
      }
      return Promise.reject(e);
    });
};

stickynotes.DBHelper.execute = function(sql, params) {
  const DBHelper = stickynotes.DBHelper;
  let c;
  stickynotes.Logger.trace(`Execute SQL: ${sql} params: ${JSON.stringify(params)}`);
  return DBHelper.connection()
    .then((conn) => {
      c = conn;
      return c.execute(sql, params);
    }).then(() => {
      return c.close();
    }).catch((e) => {
      stickynotes.Logger.trace(`SQL Error: ${e}`);
      if (c) {
        return c.close().then(() => Promise.reject(e));
      }
      return Promise.reject(e);
    });
};

stickynotes.DBHelper.row2Obj = function(row, keys) {
  return keys.reduce((obj, key) => {
    obj[key] = row.getResultByName(key);
    return obj;
  }, {});
};


var DBAccessError = function(e) {
  this.name = 'DBAccessError';
  if (e) {
    if (e.message) {
      this.message = e.message;
    } else {
      this.message = e;
    }
  } else {
    this.message = 'Database Access Error';
  }
};
DBAccessError.prototype = Object.create(Error.prototype);
DBAccessError.prototype.constructor = DBAccessError;
stickynotes.DBHelper.DBAccessError = DBAccessError;
module.exports = stickynotes.DBHelper;
