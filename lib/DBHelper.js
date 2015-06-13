var stickynotes = require('./stickynotes');
if (!stickynotes.Cc || !stickynotes.Ci) {
  let c = require('chrome');
  stickynotes.Cc = c.Cc;
  stickynotes.Ci = c.Ci;
}
/** @constructor My namespace's DBHelper */
stickynotes.DBHelper = {};
stickynotes.DBHelper.dbName = 'stickynotes';
stickynotes.DBHelper.uuid = function() {
  var name = "@mozilla.org/uuid-generator;1";
  var uuid = Cc[name].getService(Ci.nsIUUIDGenerator);
  return uuid.generateUUID().toString().substring(1, 37);
};

/**
 * getDBConn.
 * @return {connection} Database Connection.
 */
stickynotes.DBHelper.getDBConn = function() {
  var Cc = stickynotes.Cc;
  var Ci = stickynotes.Ci;
  var file = Cc['@mozilla.org/file/directory_service;1']
    .getService(Ci.nsIProperties)
    .get('ProfD', Ci.nsIFile);
  file.append(stickynotes.DBHelper.dbName + '.sqlite');
  var storageService =
    Cc['@mozilla.org/storage/service;1']
    .getService(Ci.mozIStorageService);
  // Will also create the file if if does not exist
  var dbConn = storageService.openDatabase(file);
  return dbConn;
};
/**
 * create tables.
 */
stickynotes.DBHelper.createTables = function() {
  var dbConn = stickynotes.DBHelper.getDBConn();
  dbConn.executeSimpleSQL('CREATE TABLE IF NOT EXISTS sticky(' +
                          'id INTEGER PRIMARY KEY , page_id INTEGER ,' +
                          'left INTEGER, top INTEGER, width INTEGER, ' +
                          'height INTEGER, content TEXT, color TEXT)');
  dbConn.executeSimpleSQL('CREATE TABLE IF NOT EXISTS page(' +
                          'id INTEGER PRIMARY KEY , url TEXT UNIQUE,' +
                          'title TEXT)');
  dbConn.executeSimpleSQL('CREATE TABLE IF NOT EXISTS tag(' +
                          'id INTEGER PRIMARY KEY , name TEXT UNIQUE)');
  dbConn.executeSimpleSQL('CREATE TABLE IF NOT EXISTS sticky_tag(' +
                          'id INTEGER PRIMARY KEY ,' +
                          'sticky_id INTEGER, tag_id INTEGER)');
  dbConn.executeSimpleSQL('CREATE TABLE IF NOT EXISTS version(number INTEGER)');
};
/**
 * drop tables.
 */
stickynotes.DBHelper.dropTables = function() {
  var dbConn = stickynotes.DBHelper.getDBConn();
  dbConn.executeSimpleSQL('DROP TABLE IF EXISTS "sticky" ');
  dbConn.executeSimpleSQL('DROP TABLE IF EXISTS "page" ');
  dbConn.executeSimpleSQL('DROP TABLE IF EXISTS "tag" ');
  dbConn.executeSimpleSQL('DROP TABLE IF EXISTS "sticky_tag" ');
  dbConn.executeSimpleSQL('DROP TABLE IF EXISTS "version" ');
  dbConn.close();
};

/**
 * Get Relation between sticky and tag.
 * @return {Object} relations.
*/
stickynotes.DBHelper.getRelationStickyAndTag = function() {
  var dbConn = stickynotes.DBHelper.getDBConn();
  var sql = 'SELECT * FROM sticky_tag';
  var relations = [];
  var statement = dbConn.createStatement(sql);
  while (statement.executeStep()) {
    relations.push({
      id: statement.row.id,
      sticky_id: statement.row.sticky_id,
      tag_id: statement.row.tag_id
    });
  }
  statement.finalize();
  dbConn.close();
  return relations;
};
/**
 * Get delete Relation between stikcy and tag.
 * @param {stickynotes.Sticky} sticky sticky.
 * @return {Boolean} result.
 */
stickynotes.DBHelper.deleteRelationStickyAndTag = function(sticky) {
  var dbConn = stickynotes.DBHelper.getDBConn();
  if (stickynotes.DBHelper.getStickyById(sticky.id) != null) {
    var statement = dbConn.createStatement(
      'DELETE from sticky_tag  where sticky_id=:id');
    statement.params.id = sticky.id;
    try {
      statement.execute();
    } catch (e) {
      dbConn.close();
      throw new stickynotes.DBHelperDBAccessError();
    }
    dbConn.close();
    return true;
  }
  else
    return false;
};

stickynotes.DBHelper.getVersion = function() {
  var dbConn = stickynotes.DBHelper.getDBConn();
  var sql = 'SELECT * FROM version';
  var statement = dbConn.createStatement(sql);
  var versions = [];

  try {
    while (statement.executeStep()) {
      versions.push(parseInt(statement.row.number));
    }
    if (versions.length == 0) {
      stickynotes.DBHelper.initVersion(0);
      return 0;
    } else {
      return versions[versions.length - 1];
    }
  } finally {
    statement.finalize();
    dbConn.close();
  }
};

stickynotes.DBHelper.initVersion = function(number) {
  var dbConn = stickynotes.DBHelper.getDBConn();
  var statement = dbConn.createStatement('INSERT INTO version VALUES(:number)');
  statement.params.number = number;
  try {
    statement.execute();
  } catch (e) {
    throw new stickynotes.DBHelper.DBAccessError(e);
  } finally {
    dbConn.asyncClose();
  }
};

stickynotes.DBHelper.updateVersion = function(number) {
  var dbConn = stickynotes.DBHelper.getDBConn();
  var statement = dbConn.createStatement('update version SET number=:number');
  statement.params.number = number;
  try {
    statement.execute();
  } catch (e) {
    throw new stickynotes.DBHelper.DBAccessError();
  } finally {
    dbConn.asyncClose();
  }
};


stickynotes.DBHelper.targetVersion = 1;
stickynotes.DBHelper.migrate = function() {
  var targetVersion = stickynotes.DBHelper.targetVersion;
  var currentVersion = stickynotes.DBHelper.getVersion();
  while(true) {
    if (currentVersion < targetVersion) {
      var up = stickynotes.DBHelper.migrates[currentVersion].up;
      if (up) {
        up();
      }
      currentVersion++;
    } else if (currentVersion > targetVersion) {
      var down = stickynotes.DBHelper.migrates[currentVersion-1].down;
      if (down) {
        down();
      }
      currentVersion--;
    } else {
      stickynotes.DBHelper.updateVersion(targetVersion);
      return;
    }
  }
};
stickynotes.DBHelper.migrates = [];
stickynotes.DBHelper.migrates[0] = {
  up: function() {
    var dbConn = stickynotes.DBHelper.getDBConn();
    dbConn.executeSimpleSQL('ALTER TABLE sticky ADD COLUMN uuid TEXT');
    dbConn.executeSimpleSQL('ALTER TABLE sticky ADD COLUMN user_id INTEGER');
    dbConn.executeSimpleSQL("ALTER TABLE sticky ADD COLUMN created_at TIMESTAMP");
    dbConn.executeSimpleSQL("ALTER TABLE sticky ADD COLUMN updated_at TIMESTAMP");
    dbConn.executeSimpleSQL('ALTER TABLE sticky ADD COLUMN is_deleted INTEGER DEFAULT 0');
  },
  down: function() {
  }
}

stickynotes.DBHelper.DBAccessError = function() {
    this.name = 'DBAccessError';
    this.message = 'Database Access Error';
};
stickynotes.DBHelper.DBAccessError.prototype = new Error();
module.exports = stickynotes.DBHelper;
