if (!Cc || !Ci) {
  var {Cc,Ci} = require('chrome');
}
if (!stickynotes) {
  var stickynotes = require('./stickynotes');
}
/** @constructor My namespace's DAO */
stickynotes.DAO = {};
stickynotes.DAO.dbName = 'stickynotes';
/**
 * getDBConn.
 * @return {connection} Database Connection.
 */
stickynotes.DAO.getDBConn = function() {
  var file = Cc['@mozilla.org/file/directory_service;1']
    .getService(Ci.nsIProperties)
    .get('ProfD', Ci.nsIFile);
  file.append(stickynotes.DAO.dbName + '.sqlite');
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
stickynotes.DAO.createTables = function() {
  var dbConn = stickynotes.DAO.getDBConn();
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
};
/**
 * draop tables.
 */
stickynotes.DAO.dropTables = function() {
  var dbConn = stickynotes.DAO.getDBConn();
  dbConn.executeSimpleSQL('DROP TABLE IF EXISTS "sticky" ');
  dbConn.executeSimpleSQL('DROP TABLE IF EXISTS "page" ');
  dbConn.executeSimpleSQL('DROP TABLE IF EXISTS "tag" ');
  dbConn.executeSimpleSQL('DROP TABLE IF EXISTS "sticky_tag" ');
  dbConn.close();
};

/**
 * Get Relation between sticky and tag.
 * @return {Object} relations.
*/
stickynotes.DAO.getRelationStickyAndTag = function() {
  var dbConn = stickynotes.DAO.getDBConn();
  var sql = 'SELECT * FROM sticky_tag';
  var relations = [];
//  dump(sql + '\n');
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
stickynotes.DAO.deleteRelationStickyAndTag = function(sticky) {
  var dbConn = stickynotes.DAO.getDBConn();
  if (stickynotes.DAO.getStickyById(sticky.id) != null) {
    var sql = 'DELETE from sticky_tag  where sticky_id=' + sticky.id;
    try {
      dbConn.executeSimpleSQL(sql);
    } catch (e) {
  //    dump('DataBaseException: deleteTag!  ' + e);
      dbConn.close();
      throw new DBAccessError();
    }
    dbConn.close();
    return true;
  }
  else
    return false;
};


var DBAccessError = function() {
    this.name = 'DBAccessError';
    this.message = 'Database Access Error';
};
DBAccessError.prototype = new Error();
module.exports = stickynotes.DAO;
