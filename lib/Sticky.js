if (!Cc || !Ci) {
  var {Cc,Ci} = require('chrome');
}
if (!stickynotes) {
  var stickynotes = require('./stickynotes');
}
stickynotes.Sticky = function(param) {
  this.id = param.id;
  this.title = param.title;
  this.color = param.color;
  this.width = param.width;
  this.height = param.height;
  this.left = param.left;
  this.top = param.top;
  this.content = param.content;
  this.page_id = param.page_id;
  this.page_ = param.page_;
};

/**
 * Get Sticky Objects By sticky ID.
 * @param {String} id id.
 * @return {stickynotes.Sticky} sticky.
 */
stickynotes.Sticky.fetchById = function(id) {
  var sticky, tags;
  var dbConn = stickynotes.DBHelper.getDBConn();
  if (id == null) {
    new Error('stickynotes.Page.fetchById(): id is null!');
  }
  //TODO: optimize  query, select tags together
  var sql = 'SELECT * FROM sticky WHERE id =:sticky_id';
  var statement = dbConn.createStatement(sql);
  statement.params.sticky_id = id;
  try {
    while (statement.executeStep()) {
      sticky = new stickynotes.Sticky(
        stickynotes.Sticky.row2Obj(statement.row));
      sticky.tags = sticky.getTags();
    }
  } catch (e) {
    statement.finalize();
    dbConn.close();
  }
  statement.finalize();
  dbConn.close();
  return sticky;
};
/**
 * Fetch stickies by page.
 * @param {stickynotes.Page} page page.
 * @param {string} key key string for filtering.
 */
stickynotes.Sticky.fetchByPage = function(page, key) {
  var sticky, tags;
  var result = [];
  var dbConn = stickynotes.DBHelper.getDBConn();
  //TODO: optimize  query, select tags together
  var sql = 'SELECT * FROM sticky WHERE page_id=:page_id';
  var statement = dbConn.createStatement(sql);
  statement.params.page_id = page.id;
  try {
    while (statement.executeStep()) {
      sticky = new stickynotes.
        Sticky(stickynotes.Sticky.row2Obj(statement.row));
      sticky.tags = sticky.getTags();
      if (!key || sticky.filter(key)) {
        result.push(sticky);
      }
    }
  } catch (e) {
    dbConn.asyncClose();
    throw new stickynotes.DBHelper.DBAccessError();
  }
  statement.finalize();
  dbConn.asyncClose();
  return result;
};

stickynotes.Sticky.fetchByUrl = function(url) {
  var page = stickynotes.Page.fetchByUrl(url);
  if (page === null) return [];
  return stickynotes.Sticky.fetchByPage(page);
};

stickynotes.Sticky.fetchByTag = function(tag, key) {
  var result = [];
  var dbConn = stickynotes.DBHelper.getDBConn();
  //TODO: optimize  query, select tags together
  var sql = 'SELECT * FROM sticky ' +
    'LEFT OUTER JOIN sticky_tag ON (sticky.id=sticky_tag.sticky_id) ' +
    'LEFT OUTER JOIN tag ON (sticky_tag.tag_id=tag.id) ' +
    'WHERE tag.id=:tag_id';
  var statement = dbConn.createStatement(sql);
  statement.params.tag_id = tag.id;
  try {
    while (statement.executeStep()) {
      var sticky = new stickynotes
        .Sticky(stickynotes.Sticky.row2Obj(statement.row));
      sticky.tags = sticky.getTags();
      if (!key || sticky.filter(key)) {
        result.push(sticky);
      }
    }
  } catch (e) {
    statement.finalize();
    dbConn.asyncClose();
  }
  statement.finalize();
  dbConn.asyncClose();
  return result;
};
/**
 * Get Sticky Objects By key string.
 * @return {Array<stickynotes.Sticky>} sticky objects.
 */
stickynotes.Sticky.fetchAll = function(key) {
  var result = [];
  var sticky, tags;
  var dbConn = stickynotes.DBHelper.getDBConn();
  //TODO: optimize  query, select tags together
  var sql = 'SELECT * FROM sticky';
  var statement = dbConn.createStatement(sql);
  try {
    while (statement.executeStep()) {
      sticky = new stickynotes.Sticky(stickynotes.Sticky.row2Obj(statement.row));
      sticky.tags = sticky.getTags();
      if (!key || sticky.filter(key)) {
        result.push(sticky);
      }
    }
  } catch (e) {
    dbConn.asyncClose();
    throw new stickynotes.DBHelper.DBAccessError();
  }
  statement.finalize();
  dbConn.asyncClose();
  return result;
};

stickynotes.Sticky.create = function(param) {
  if (!param.id) {
    param.id = Math.round(Math.random() * 10000);
  }
  if (!param.url) {
    throw new Error('param.url is null!');
  }
  param.page_ = stickynotes.Page.fetchByUrl(param.url);
  if (!param.page_) {
    param.page_id = Math.round(Math.random() * 10000);
    if (!param.title) {
      param.title = window.parent.content.document.location.href;
    }
    param.page_ = stickynotes.Page.create({
      id: param.page_id,
      url: param.url,
      title: param.title
    });
  }
  else {
    param.page_id = param.page_.id;
  }
  var dbConn = stickynotes.DBHelper.getDBConn();
  var statement = dbConn.createStatement(
    'insert into sticky values(:id,:page_id,:left,:top,:width,:height,' +
      ':content,:color)');
  statement.params.id = param.id;
  statement.params.page_id = param.page_id;
  statement.params.left = param.left ? param.left : 100;
  statement.params.top = param.top ? param.top : 100;
  statement.params.width = param.width ? param.width : 100;
  statement.params.height = param.height ? param.height : 100;
  statement.params.content = param.content ? param.content : '';
  statement.params.color = param.color ? param.color : 'blue';
  try {
    statement.execute();
    dbConn.asyncClose();
  } catch (e) {
    dbConn.asyncClose();
    throw new stickynotes.DBHelper.DBAccessError();
  }
  var sticky = new stickynotes.Sticky(param);
  sticky.tags = sticky.getTags();
  return sticky;
};

stickynotes.Sticky.prototype.save = function() {
  var dbConn = stickynotes.DBHelper.getDBConn();
  var statement = dbConn.createStatement(
    'UPDATE sticky SET left=:left,top=:top,width=:width,' +
      'height=:height,content=:content,color=:color WHERE id=:id');
  statement.params.id = this.id;
  statement.params.left = this.left;
  statement.params.top = this.top;
  statement.params.width = this.width;
  statement.params.height = this.height;
  statement.params.content = this.content;
  statement.params.color = this.color;
  try {
    statement.execute();
  } catch (e) {
    dbConn.asyncClose();
    throw new stickynotes.DBHelper.DBAccessError();
  } finally {
    dbConn.asyncClose();
  }
  return true;
};

stickynotes.Sticky.prototype.remove = function() {
  var dbConn = stickynotes.DBHelper.getDBConn();
  var statement = dbConn.createStatement('DELETE FROM sticky WHERE id=:id');
  statement.params.id = this.id;
  if (stickynotes.Sticky.fetchById(this.id) != null) {
    try {
      statement.execute();
    } catch (e) {
      dbConn.close();
      throw new stickynotes.DBHelper.DBAccessError();
    } finally {
      dbConn.asyncClose();
    }
    return true;
  }
  else
    return false;
};
/**
 * set tags.
 * @param {Array<String>} tagStrs tag.
 */
stickynotes.Sticky.prototype.setTags = function(tagStrs) {
  var tags = [];
  var dbConn = stickynotes.DBHelper.getDBConn();
  var statement = dbConn.createStatement(
    'DELETE from sticky_tag  where sticky_id=:s_id');
  statement.params.s_id = this.id;
  try {
      statement.execute();
  } catch (e) {
    dbConn.asyncClose();
    throw new stickynotes.DBHelper.DBAccessError();
  }

  var str, tag, id, relation_id;
  for (var i = 0; i < tagStrs.length; i++) {
    str = stickynotes.Tag.trimWhiteSpace(tagStrs[i]);
    tag = stickynotes.Tag.fetchByName(str);
    if (!tag) {
      tag = stickynotes.Tag.create({name: str});
    }
    relation_id = Math.round(Math.random() * 10000);
    tags.push(tag);
    statement = dbConn.createStatement(
      'INSERT INTO sticky_tag VALUES(:r_id,:s_id,:t_id)');
    statement.params.r_id = relation_id;
    statement.params.s_id = this.id;
    statement.params.t_id = tag.id;
    try {
      statement.execute();
    } catch (e) {
      dbConn.asyncClose();
      throw new stickynotes.DBHelper.DBAccessError();
    }
  }
  dbConn.asyncClose();
  this.tags = tags;
  return true;
};

stickynotes.Sticky.prototype.getTags = function() {
  var result = [];
  var dbConn = stickynotes.DBHelper.getDBConn();
  var sql = 'SELECT * FROM tag, sticky, sticky_tag WHERE ' +
    'tag.id=sticky_tag.tag_id AND sticky.id=sticky_tag.sticky_id' +
    ' AND sticky.id=:sticky_id';
  try {
    var statement = dbConn.createStatement(sql);
  statement.params.sticky_id = this.id;
    while (statement.executeStep()) {
      var tag = new stickynotes.Tag({
        id: statement.row.id,
        name: statement.row.name
      });
      result.push(tag);
    }
  } catch (e) {
    statement.finalize();
    dbConn.close();
  }
  statement.finalize();
  dbConn.close();
  return result;
};

stickynotes.Sticky.prototype.getPage = function() {
  if (this.page_)
    return this.page_;
  this.page_ = stickynotes.Page.fetchById(this.page_id);
  return this.page_;
};

stickynotes.Sticky.prototype.filter = function(key) {
  if (key == null || this.content.indexOf(key) != -1) {
    return true;
  } else if (this.getPage().title.indexOf(key) != -1) {
    return true;
  } else {
    return !this.tags.every(function(t) {
      return t.name.indexOf(key) == -1;
    });
  }
};

/**
 * transform database result row Object to JS Plain Object.
 * @param {Object} row row.
 * @param {Array<String>} name_array keys.
 * @return {Object} obj.
 */
stickynotes.Sticky.row2Obj = function(row, name_array) {
  if (!name_array)
    return {
      id: row.id,
      page_id: row.page_id,
      left: row.left,
      top: row.top,
      width: row.width,
      height: row.height,
      content: row.content,
      color: row.color
    };
  else {
    var obj = { };
    for (var i = 0; i < name_array.length; i++) {
      obj[name_array[i]] = row[name_array[i]];
    }
    return obj;
  }
};
module.exports = stickynotes.Sticky;
