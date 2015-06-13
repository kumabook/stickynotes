if (!stickynotes) {
  var stickynotes = require('./stickynotes');
}

stickynotes.Sticky = function(param) {
  this.id         = param.id;
  this.uuid       = param.uuid;
  this.title      = param.title;
  this.color      = param.color;
  this.width      = param.width;
  this.height     = param.height;
  this.left       = param.left;
  this.top        = param.top;
  this.content    = param.content;
  this.is_deleted = param.is_deleted;
  this.created_at = param.created_at;
  this.updated_at = param.updated_at;
  this.page_id    = param.page_id;
  this.page_      = param.page_;
  this.user_id    = param.user_id;
};
stickynotes.Sticky.init_keys = ['id', 'uuid', 'created_at'];
stickynotes.Sticky.keys = ['id',
                           'uuid',
                           'page_id',
                           'left', 'top',
                           'width', 'height',
                           'content',
                           'color',
                           'created_at',
                           'updated_at',
                           'user_id',
                           'is_deleted'];

function sort(items) {
  return items.sort(function(a, b) {
    return a.content > b.content;
  });
};

/**
 * Get Sticky Objects By sticky ID.
 * @param {String} id id.
 * @return {stickynotes.Sticky} sticky.
 */
stickynotes.Sticky.fetchByUUID = function(uuid) {
  var sticky, tags;
  var dbConn = stickynotes.DBHelper.getDBConn();
  if (uuid == null) {
    new Error('stickynotes.Page.fetchByUUID(): uuid is null!');
  }
  //TODO: optimize  query, select tags together
  var sql = 'SELECT * FROM sticky WHERE uuid =:uuid';
  var statement = dbConn.createStatement(sql);
  statement.params.uuid = uuid;
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
  return sort(result);
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
  return sort(result);
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
  return sort(result);
};

stickynotes.Sticky.create = function(param) {
  if (!param.id) {
    param.id = Math.round(Math.random() * 10000);
  }
  if (!param.uuid) {
    param.uuid = stickynotes.DBHelper.uuid();
  }
  if (!param.url) {
    throw new Error('param.url is null!');
  }
  if (!param.user_id) {
    param.user_id = 0;
  }
  if (!param.is_deleted) {
    param.is_deleted = 0;
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
  } else {
    param.page_id = param.page_.id;
  }
  var dbConn = stickynotes.DBHelper.getDBConn();
  var values = stickynotes.Sticky.keys.map(function(k) {
    return ':' + k;
  });
  var sql = 'INSERT INTO sticky(' + stickynotes.Sticky.keys.join(',') +
        ') VALUES(' + values.join(',') + ')';
  var statement = dbConn.createStatement(sql);
  var now = stickynotes.DBHelper.getCurrentDateStr();
  if (!param.created_at) {
    param.created_at = now;
  }
  if (!param.updated_at) {
    param.updated_at = now;
  }
  statement.params.id         = param.id;
  statement.params.uuid       = param.uuid;
  statement.params.page_id    = param.page_id;
  statement.params.left       = param.left ? param.left : 100;
  statement.params.top        = param.top ? param.top : 100;
  statement.params.width      = param.width ? param.width : 100;
  statement.params.height     = param.height ? param.height : 100;
  statement.params.content    = param.content ? param.content : '';
  statement.params.color      = param.color ? param.color : 'blue';
  statement.params.created_at = param.created_at;
  statement.params.updated_at = param.updated_at;
  statement.params.user_id    = param.user_id;
  statement.params.is_deleted = param.is_deleted;
  try {
    statement.execute();
  } catch (e) {
    throw new stickynotes.DBHelper.DBAccessError();
  } finally {
    dbConn.asyncClose();
  }
  var sticky = new stickynotes.Sticky(param);
  if (param.tags) {
    sticky.setTags(param.tags);
  } else {
    sticky.tags = [];
  }
  return sticky;
};

stickynotes.Sticky.prototype.save = function() {
  this.updated_at = stickynotes.DBHelper.getCurrentDateStr();
  var dbConn = stickynotes.DBHelper.getDBConn();
  var keys = stickynotes.Sticky.keys.filter(function(k) {
    return stickynotes.Sticky.init_keys.indexOf(k) == -1;
  });
  var values = keys.map(function(k) {
    return k + '=:' + k;
  });
  var sql = 'UPDATE sticky SET ' + values.join(',') + ' WHERE uuid=:uuid';
  var statement = dbConn.createStatement(sql);
  statement.params.uuid = this.uuid;
  var self = this;
  keys.forEach(function(key) {
    statement.params[key]  = self[key];
  });
  try {
    statement.execute();
  } catch (e) {
    throw new stickynotes.DBHelper.DBAccessError();
  } finally {
    dbConn.asyncClose();
  }
  return true;
};

stickynotes.Sticky.prototype.remove = function() {
  var dbConn = stickynotes.DBHelper.getDBConn();
  var statement = dbConn.createStatement('DELETE FROM sticky WHERE uuid=:uuid');
  statement.params.uuid = this.uuid;
  if (stickynotes.Sticky.fetchByUUID(this.uuid) != null) {
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
  if (key == null) return true;
  key = key.toLowerCase();
  if (this.content.toLowerCase().indexOf(key) != -1) {
    return true;
  } else if (this.getPage().title.toLowerCase().indexOf(key) != -1) {
    return true;
  } else {
    return !this.tags.every(function(t) {
      return t.name.toLowerCase().indexOf(key) == -1;
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
            uuid: row.uuid,
         page_id: row.page_id,
         user_id: row.user_id,
            left: row.left,
             top: row.top,
           width: row.width,
          height: row.height,
         content: row.content,
           color: row.color,
      created_at: row.created_at,
      updated_at: row.updated_at,
      is_deleted: row.is_deleted
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
