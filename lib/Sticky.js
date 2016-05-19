if (!stickynotes) {
  var stickynotes = require('./stickynotes');
}

stickynotes.Sticky = function(param) {
  this.update(param);
};
stickynotes.Sticky.init_keys = ['id', 'uuid', 'created_at'];
stickynotes.Sticky.keys = ['id',
                           'uuid',
                           'page_id',
                           'left', 'top',
                           'width', 'height',
                           'content',
                           'color',
                           'created_at', 'updated_at',
                           'user_id',
                           'is_deleted'];

function sort(items) {
  return items.sort(function(a, b) {
    return a.content > b.content;
  });
}

stickynotes.Sticky.prototype.update = function(param) {
  var self = this;
  stickynotes.Sticky.keys.forEach(function(key) {
    if (param[key] !== undefined) {
      self[key] = param[key];
    }
  });
  if (param.page_ !== undefined) {
    this.page_ = param.page_;
  }
};

stickynotes.Sticky.fetch = function(sql) {
  return stickynotes.DBHelper.fetch(stickynotes.Sticky, sql);
};

/**
 * Get Sticky Objects By key string.
 * @return {Array<stickynotes.Sticky>} sticky objects.
 */
stickynotes.Sticky.fetchAll = function(key) {
  const sql = 'SELECT * FROM sticky';
  return this.fetch(sql)
    .then((stickies) => stickies.sort((a, b) => a.content > b.content));
};

/**
 * Get Sticky Objects By sticky ID.
 * @param {String} id id.
 * @return {stickynotes.Sticky} sticky.
 */
stickynotes.Sticky.fetchByUUID = function(uuid) {
  if (uuid == null) new Error('stickynotes.Page.fetchByUUID(): uuid is null!');
  //TODO: optimize  query, select tags together
  const sql = 'SELECT * FROM sticky WHERE uuid =:uuid';
  const params = { uuid: uuid };
  this.fetch(sql, params)
      .map(() => sticky.fetchTags());
};
/**
 * Fetch stickies by page.
 * @param {stickynotes.Page} page page.
 * @param {string} key key string for filtering.
 */
stickynotes.Sticky.fetchByPage = function(page, key) {
  //TODO: optimize  query, select tags together
  const sql = 'SELECT * FROM sticky WHERE page_id=:page_id';
  const params = { page_id: page.id };
  this.fetch(sql, params)
      .map(() => sticky.fetchTags())
      .filter(() => !key || sticky.filter(key))
      .sort((a, b) => a.content > b.content);
};

stickynotes.Sticky.fetchByUrl = function(url) {
  stickynotes.Page.fetchByUrl(url).then((page) => {
    if (page === null) return [];
    return stickynotes.Sticky.fetchByPage(page);
  });
};

stickynotes.Sticky.fetchByTag = function(tag, key) {
  //TODO: optimize  query, select tags together
  const sql = 'SELECT * FROM sticky ' +
    'LEFT OUTER JOIN sticky_tag ON (sticky.id=sticky_tag.sticky_id) ' +
    'LEFT OUTER JOIN tag ON (sticky_tag.tag_id=tag.id) ' +
          'WHERE tag.id=:tag_id';
  const params = {
    tag_id: tag.id
  };
  return this.fetch(sql, params)
             .map((sticky) => sticky.fetchTags())
             .filter((sticky) => !key || sticky.filter(key))
             .sort((a, b) => a.content > b.content);
};

/**
 * Get Sticky Objects By key string.
 * @return {Array<stickynotes.Sticky>} sticky objects.
 */
stickynotes.Sticky.fetchUpdatedStickiesSince = function(date) {
  //TODO: optimize  query, select tags together
  const sql = 'SELECT * FROM sticky WHERE' +
        ' datetime(updated_at) >= datetime(\'' +
        date.toISOString() + '\')';
  return this.fetch(sql)
             .map((sticky) => sticky.fetchTags());
};


stickynotes.Sticky.create = function(param) {
  if (!param.url) {
    throw new Error('param.url is null!');
  }
  return stickynotes.Page.findOrCreate(param.url).then((page) => {
    const values = stickynotes.Sticky.keys.map(function(k) {
      return ':' + k;
    });
    const sql = 'INSERT INTO sticky(' + stickynotes.Sticky.keys.join(',') +
            ') VALUES(' + values.join(',') + ')';
    const now = new Date().toISOString();
    const params = {
            id: param.id         ? param.id : Math.round(Math.random() * 10000),
          uuid: param.uuid       ? param.uuid : stickynotes.DBHelper.uuid(),
       page_id: param.page_id    ? param.page_id : 0,
          left: param.left       ? param.left : 100,
           top: param.top        ? param.top : 100,
         width: param.width      ? param.width : 100,
        height: param.height     ? param.height : 100,
       content: param.content    ? param.content : '',
         color: param.color      ? param.color : 'blue',
    created_at: param.created_at ? param.created_at : now,
    updated_at: param.updated_at ? param.updated_at : now,
       user_id: param.user_id,
    is_deleted: param.is_deleted ? 1 : 0
    };
    return DBHelper.connection()
      .then(  (conn) => conn.execute(sql, params))
      .then(      () => new stickynotes.Sticky(param))
      .then((sticky) => sticky.setTags(param.tags));
  });
};

stickynotes.Sticky.prototype.save = function() {
  this.updated_at = new Date().toISOString();
  const keys = stickynotes.Sticky.keys.filter((k) => {
    return stickynotes.Sticky.init_keys.indexOf(k) == -1;
  });
  const values = keys.map((k) => k + '=:' + k);
  const sql = 'UPDATE sticky SET ' + values.join(',') + ' WHERE uuid=:uuid';
  let params = { uuid: this.uuid };
  const self = this;
  keys.forEach(function(key) {
    if (key === 'is_deleted') {
      params[key] = self[key] ? 1 : 0;
    } else {
      params[key] = self[key];
    }
  });
  return DBHelper.connection().then((conn) => conn.execute(sql, params));
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
      throw new stickynotes.DBHelper.DBAccessError(e);
    } finally {
      dbConn.asyncClose();
    }
    return true;
  }
  else
    return false;
};

stickynotes.Sticky.prototype.deleteStickyTags = function() {
  const sql = 'DELETE from sticky_tag  where sticky_id=:s_id';
  const params = { s_id: this.id };
};
/**
 * set tags.
 * @param {Array<String>} tagStrs tag.
 */
stickynotes.Sticky.prototype.setTags = function(tagStrs) {
  let tags = [];
  return Promise.all(tagStrs.map((tagStr) => {
    const name = stickynotes.Tag.trimWhiteSpace(tagStr);
    return stickynotes.Tag.findOrCreateByName(name).then((tag) => {
      const relation_id = Math.round(Math.random() * 10000);
      tags.push(tag);
      const sql = 'INSERT INTO sticky_tag VALUES(:r_id,:s_id,:t_id)';
      const params = {
        r_id: relation_id,
        s_id: this.id,
        t_id: tag.id
      };
      return DBHelper.connection()
        .then((conn) => conn.execute(sql, params));
    });
  }));
};

stickynotes.Sticky.prototype.fetchTags = function() {
  const DBHelper = stickynotes.DBHelper;
  const row2Obj  = DBHelper.row2Obj;
  const Tag      = stickynotes.Tag;
  const keys     = ['id', 'name'];
  const sql      = 'SELECT * FROM tag, sticky, sticky_tag WHERE ' +
          'tag.id=sticky_tag.tag_id AND sticky.id=sticky_tag.sticky_id' +
          ' AND sticky.id=:sticky_id';
  const params   = { sticky_id: this.id };
  return DBHelper.connection()
    .then((conn) => conn.execute(sql, params))
    .then((rows) => rows.map((row) => new stickynotes.Tag(row2Obj(row, keys))));
};

stickynotes.Sticky.prototype.fetchTags = function() {
  this.getTags().then((tags) => {
    this.tags = tags;
    return this;
  });
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

module.exports = stickynotes.Sticky;
