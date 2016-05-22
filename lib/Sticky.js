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

stickynotes.Sticky.fetch = function(sql, params) {
  return stickynotes.DBHelper.fetch(stickynotes.Sticky, sql, params);
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
  if (uuid == null) throw new Error('stickynotes.Page.fetchByUUID(): uuid is null!');
  //TODO: optimize  query, select tags together
  const sql = 'SELECT * FROM sticky WHERE uuid =:uuid';
  const params = { uuid: uuid };
  return this.fetch(sql,  params)
    .then((l) => l.find((s) => s.uuid === uuid))
    .then(((sticky) => {
      if (sticky) {
        return sticky.fetchTags();
      } else {
        return null;
      }
    }));
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
  return this.fetch(sql, params).then((stickies) => {
    return Promise.all(stickies.map((sticky) => sticky.fetchTags()));
  }).then((stickies) => {
    return stickies
      .filter((sticky) => !key || sticky.filter(key))
      .sort((a, b) => a.content > b.content);
  });
};

stickynotes.Sticky.fetchByUrl = function(url) {
  return stickynotes.Page.fetchByUrl(url).then((page) => {
    if (page) return stickynotes.Sticky.fetchByPage(page);
    else      return [];
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
  return this.fetch(sql, params).then((stickies) => {
    return Promise.all(stickies.map((sticky) => sticky.fetchTags()));
  }).then((stickies) => {
    return stickies
      .filter((sticky) => !key || sticky.filter(key))
      .sort((a, b) => a.content > b.content)
      .map((sticky) => sticky.fetchTags());
  });
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
  return this.fetch(sql).then((stickies) => {
    return Promise.all(stickies.map((sticky) => sticky.fetchTags()));
  });
};


stickynotes.Sticky.create = function(param) {
  if (!param.url) {
    throw new Error('param.url is null!');
  }
  if (!param.tags) {
    param.tags = [];
  }
  return stickynotes.Page.findOrCreate(param.url, param.title).then((page) => {
    const values = stickynotes.Sticky.keys.map(function(k) {
      return ':' + k;
    });
    const sql = 'INSERT INTO sticky(' + stickynotes.Sticky.keys.join(',') +
            ') VALUES(' + values.join(',') + ')';
    const now = new Date().toISOString();
    const params = {
            id: param.id         ? param.id : Math.round(Math.random() * 10000),
          uuid: param.uuid       ? param.uuid : stickynotes.DBHelper.uuid(),
       page_id: param.page_id    ? param.page_id : page.id,
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
    return stickynotes.DBHelper.execute(sql, params)
      .then(      () => new stickynotes.Sticky(params))
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
  keys.forEach((key) => {
    if (key === 'is_deleted') {
      params[key] = this[key] ? 1 : 0;
    } else {
      params[key] = this[key];
    }
  });
  return stickynotes.DBHelper.execute(sql, params);
};

stickynotes.Sticky.prototype.remove = function() {
  const sql    = 'DELETE FROM sticky WHERE uuid=:uuid';
  const params = { uuid: this.uuid };
  return stickynotes.Sticky.fetchByUUID(this.uuid).then((sticky) => {
    if (sticky != null) {
      return stickynotes.DBHelper.execute(sql, params);
    } else {
      return Promise.reject('Record Not found');
    }
  });
};

stickynotes.Sticky.prototype.deleteStickyTags = function() {
  const sql = 'DELETE from sticky_tag  where sticky_id=:s_id';
  const params = { s_id: this.id };
  return stickynotes.DBHelper.execute(sql, params);
};
/**
 * set tags.
 * @param {Array<String>} tagStrs tag.
 */
stickynotes.Sticky.prototype.setTags = function(tagStrs) {
  let tags = [];
  return this.deleteStickyTags().then(() => {
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
        return stickynotes.DBHelper.execute(sql, params);
      });
    }));
  }).then(() => {
    this.tags = tags;
    return this;
  });
};

stickynotes.Sticky.prototype.getTags = function() {
  const DBHelper = stickynotes.DBHelper;
  const row2Obj  = DBHelper.row2Obj;
  const Tag      = stickynotes.Tag;
  const sql      = 'SELECT * FROM sticky_tag, sticky, tag WHERE ' +
          'tag.id=sticky_tag.tag_id AND sticky.id=sticky_tag.sticky_id' +
          ' AND sticky.id=:sticky_id';
  const params   = { sticky_id: this.id };
  return DBHelper.fetch(stickynotes.Tag, sql, params);
};

stickynotes.Sticky.prototype.fetchTags = function() {
  return this.getTags().then((tags) => {
    this.tags = tags;
    return this;
  });
};

stickynotes.Sticky.prototype.getPage = function() {
  return this.page_;
};

stickynotes.Sticky.prototype.fetchPage = function() {
  return new Promise((resolve, reject) => {
    if (this.page_)
      return resolve(this);
    return stickynotes.Page.fetchById(this.page_id).then((page) => {
      this.page_ = page;
      return resolve(this);
    });
  });
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
