stickynotes.Page = function(param) {
  this.id = param.id;
  this.url = param.url;
  this.title = param.title;
};

stickynotes.Page.prototype.save = function() {
  
};

stickynotes.Page.prototype.update = function() {
    
};
/**
 * insert page to page table.
 * @param {Object} page page object
 * @return {Boolean} success->true, fail->false.
*/
stickynotes.Page.create = function(param) {
  var dbConn = stickynotes.DAO.getDBConn();
  var statement = dbConn
    .createStatement('INSERT INTO page VALUES(:id,:url,:title)');
  statement.params.id = param.id;
  statement.params.url = param.url;
  statement.params.title = param.title;
  try {
    statement.execute();
    dbConn.asyncClose();
  } catch (e) {
    dbConn.asyncClose();
    throw new DBAccessError(e);
  }
  var page = new stickynotes.Page(param);
  return page;
};
/**
 * Get Page Object By ID.
 * @param {String} id id.
 * @return {Object} page object.
*/
stickynotes.Page.fetchById = function(id) {
  var dbConn = stickynotes.DAO.getDBConn();
  var statement = dbConn.createStatement('SELECT * FROM page WHERE id=:id');
  statement.params.id = id;
  var page = null;
  try {
    while (statement.executeStep()) {
      page = {
        id: statement.row.id,
        url: statement.row.url,
        title: statement.row.title
      };
    }
  } catch (e) {
    dbConn.asyncClose();
    throw new DBAccessError();
  }
  statement.finalize();
  dbConn.asyncClose();
  return page;
};
/**
 * Get Page Object By ID.
 * @param {String} id id.
 * @return {Object} page object.
*/
stickynotes.Page.fetchByUrl = function(url) {
  var dbConn = stickynotes.DAO.getDBConn();
  var statement = dbConn.createStatement('SELECT * FROM page WHERE url=:url');
  if (url == null)
    new Error('stickynotes.Page.fetchByUrl(): url is null!');
  statement.params.url = url;
  var page = null;
  try {
    while (statement.executeStep()) {
      page = {
        id: statement.row.id,
        url: statement.row.url,
        title: statement.row.title
      };
      statement.finalize();
      dbConn.asyncClose();
      return new stickynotes.Page(page);
    }
  } catch (e) {
    dbConn.asyncClose();
    throw new DBAccessError();
  }
  return null;
};

/**
 * Get Page Objects.
 * @return {Object} pages.
 */
stickynotes.Page.fetchAll = function() {
  var result = [];
  var dbConn = stickynotes.DAO.getDBConn();
  var sql = 'SELECT * FROM page ';
  var statement = dbConn.createStatement(sql);
  try {
    while (statement.executeStep()) {
      var page = {
        id: statement.row.id,
        url: statement.row.url,
        title: statement.row.title
      };
      result.push(page);
    }
  } catch (e) {
    dbConn.asyncClose();
    throw new DBAccessError();
    }
  return result;
};