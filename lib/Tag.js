/**
 * tag class
 * @constructor
 * @param {Object} hash.
 */
if (!stickynotes) {
  var stickynotes = require('./stickynotes');
}
stickynotes.Tag = function(param) {
  this.id = param.id;
  this.name = param.name;
};

stickynotes.Tag.trimWhiteSpace = function(str) {
  return str.replace(/^[\s　]+|[\s　]+$/g, '');
};

stickynotes.Tag.create = function(param) {
  param.name = stickynotes.Tag.trimWhiteSpace(param.name);
  if (!param.id) {
      param.id = Math.round(Math.random() * 10000);
  }
  var dbConn = stickynotes.DAO.getDBConn();
  var statement =
    dbConn.createStatement('INSERT INTO tag VALUES(:id, :name)');
  statement.params.id = param.id;
  statement.params.name = param.name;
  try {
    statement.execute();
  } catch (e) {
    dbConn.asyncClose();
    throw new stickynotes.DAO.DBAccessError(e);
  }
  dbConn.asyncClose();
  return new stickynotes.Tag(param);
};

stickynotes.Tag.fetchById = function(id) {
  var tag;
  var dbConn = stickynotes.DAO.getDBConn();
  var sql = 'SELECT * FROM tag WHERE id=' + id;
  var statement = dbConn.createStatement(sql);
  try {
    while (statement.executeStep()) {
      tag = new stickynotes.Tag(
        { id: statement.row.id, name: statement.row.name});
    }
  } catch (e) {
    statement.finalize();
    dbConn.close();
  }
  statement.finalize();
  dbConn.close();
  return tag;
};

stickynotes.Tag.fetchByName = function(name) {
  name = name.replace(/^[\s　]+|[\s　]+$/g, '');
  var dbConn = stickynotes.DAO.getDBConn();
  var statement = dbConn.createStatement(
    'SELECT * FROM tag WHERE name=:name');
  statement.params.name = name;
  var tag = null;
  try {
    while (statement.executeStep()) {
      tag = new stickynotes.Tag({
        id: statement.row.id,
        name: statement.row.name
      });
    }
  } catch (e) {
    dbConn.asyncClose();
    throw new stickynotes.DAO.DBAccessError(e);
  }
  statement.finalize();
  dbConn.asyncClose();
  return tag;
};
stickynotes.Tag.fetchAll = function() {
  var result = [];
  var dbConn = stickynotes.DAO.getDBConn();
  var sql = 'SELECT * FROM tag ';
  try {
    var statement = dbConn.createStatement(sql);
    while (statement.executeStep()) {
      var tag = new stickynotes.Tag({
        id: statement.row.id,
        name: statement.row.name
      });
      result.push(tag);
    }
  } catch (e) {
    statement.finalize();
    dbConn.asyncClose();
    throw new DBAccessError(e);
  }
  return result;
};

stickynotes.Tag.prototype.remove = function() {
  var dbConn = stickynotes.DAO.getDBConn();
  var sql = 'DELETE from tag where id=' + this.id;
    try {
      dbConn.executeSimpleSQL(sql);
    } catch (e) {
      dbConn.asyncClose();
      throw new DBAccessError();
    }
  dbConn.asyncClose();
  return true;
};
/**
 * Get stickies.
 */
stickynotes.Tag.prototype.getStickies = function() {
  var dbConn = stickynotes.DAO.getDBConn();
  var statement = dbConn.createStatement(
    'SELECT * FROM sticky_tag WHERE tag_id=:tag_id');
  statement.tag_id = this.id;
  var stickies = [];
  while (statement.executeStep()) {
    var id = statement.row.sticky_id;
    stickies.push(stickynotes.Sticky.fetchById(id));
  }
  statement.finalize();
  dbConn.close();
  return stickies;
};
module.exports = stickynotes.Tag;
