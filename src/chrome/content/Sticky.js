/**
 *
 */
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
//  this.tag = param.tag;
};
/**
 * Get Sticky Objects By sticky ID.
 * @param {String} id id.
 * @return {stickynotes.Sticky} sticky.
 */
stickynotes.Sticky.fetchById = function(id) {
  var sticky, tags;
  var dbConn = stickynotes.DAO.getDBConn();
    if (id == null)
    new Error('stickynotes.Page.fetchById(): id is null!');
  var sql = 'SELECT * FROM sticky WHERE id = ' + id;

  var statement = dbConn.createStatement(sql);
  try {
    while (statement.executeStep()) {
      sticky = new stickynotes.Sticky(
        stickynotes.Sticky.row2Obj(statement.row));
//      tags = stickynotes.DAO.getTagsBySticky(sticky);
  //    sticky.tags = tags;
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
  var dbConn = stickynotes.DAO.getDBConn();
  var sql = 'SELECT * FROM sticky WHERE page_id=' + page.id;
  var statement = dbConn.createStatement(sql);
  try {
    while (statement.executeStep()) {
      sticky = new stickynotes.
        Sticky(stickynotes.Sticky.row2Obj(statement.row));
      if (sticky.filter(key))
        result.push(sticky);
    }
  } catch (e) {
    dbConn.asyncClose();
    throw new DBAccessError();
  }
  statement.finalize();
  dbConn.asyncClose();
  return result;
};
stickynotes.Sticky.fetchByTag = function(tag, key) {
  var result = [];
  var dbConn = stickynotes.DAO.getDBConn();
  var sql = 'SELECT * FROM sticky ' +
    'LEFT OUTER JOIN sticky_tag ON (sticky.id=sticky_tag.sticky_id) ' +
    'LEFT OUTER JOIN tag ON (sticky_tag.tag_id=tag.id) ' +
    "WHERE tag.id='" + tag.id + "'";
  //  dump(sql + '\n');
  var statement = dbConn.createStatement(sql);
  try {
    while (statement.executeStep()) {
      var sticky = new stickynotes
        .Sticky(stickynotes.Sticky.row2Obj(statement.row));
      if (sticky.filter(key))
        result.push(sticky);
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
  var dbConn = stickynotes.DAO.getDBConn();
  var sql = 'SELECT * FROM sticky';
  var statement = dbConn.createStatement(sql);
  try {
    while (statement.executeStep()) {
      sticky = new stickynotes.Sticky(stickynotes.Sticky.row2Obj(statement.row));
      if (sticky.filter(key)) {
        result.push(sticky);  
      }
        
    }
  } catch (e) {
    dbConn.asyncClose();
    throw new DBAccessError();
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
  var dbConn = stickynotes.DAO.getDBConn();
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
  statement.params.color = param.color ? param.color: 'blue';

  try {
    statement.execute();
    dbConn.asyncClose();
  } catch (e) {
    dbConn.asyncClose();
    throw new DBAccessError();
  }
  var sticky = new stickynotes.Sticky(param);
  return sticky;
};

stickynotes.Sticky.prototype.save = function() {
  var dbConn = stickynotes.DAO.getDBConn();
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
    throw new DBAccessError();
  } finally {
    dbConn.asyncClose();
  }
  return true;
};

stickynotes.Sticky.prototype.remove = function() {
  var dbConn = stickynotes.DAO.getDBConn();
  var statement = dbConn.createStatement('DELETE FROM sticky WHERE id=:id');
  statement.params.id = this.id;
  if (stickynotes.Sticky.fetchById(this.id) != null) {
    try {
      statement.execute();
    } catch (e) {
      dbConn.close();
      throw new DBAccessError();
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
  var dbConn = stickynotes.DAO.getDBConn();
  var statement = dbConn.createStatement(
    'DELETE from sticky_tag  where sticky_id=:s_id');
  statement.params.s_id = this.id;
  try {
      statement.execute();
  } catch (e) {
    dbConn.asyncClose();
    throw new DBAccessError();
  }
  
  var str, tag, id, relation_id;
  for (var i = 0; i < tagStrs.length; i++) {
    str = tagStrs[i].replace(/^[\s　]+|[\s　]+$/g, '');//trim;
    tag = stickynotes.Tag.fetchByName(str);
    if (!tag) {
      tag = stickynotes.Tag.create({name: str});
    }
    relation_id = Math.round(Math.random() * 10000);

    statement = dbConn.createStatement(
      'INSERT INTO sticky_tag VALUES(:r_id,:s_id,:t_id)');
    statement.params.r_id = relation_id;
    statement.params.s_id = this.id;
    statement.params.t_id = tag.id;
    try {
      statement.execute();
    } catch (e) {
      dbConn.asyncClose();
      throw new DBAccessError();
    }
  }
  dbConn.asyncClose();
  return true;
};

stickynotes.Sticky.prototype.getTags = function() {
  var result = [];
  var dbConn = stickynotes.DAO.getDBConn();
  var sql = 'SELECT * FROM tag, sticky, sticky_tag WHERE ' +
    'tag.id=sticky_tag.tag_id AND sticky.id=sticky_tag.sticky_id' +
    ' AND sticky.id=' + this.id;
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
  if (key == null ||
      this.content.indexOf(key) != -1) 
    return true;
  else if (this.getPage().title.indexOf(key) != -1 )
    return true;
  return false;
};
/**
 * jump to Sticky.
 */
stickynotes.Sticky.prototype.jump = function() {
  var href = window.content.document.location.href;
  var page = this.getPage();
  if (page == '')
    return;
  var url = page.url;
  if (url == '')
    return;
  if (url == href)
    window.parent.content.document
    .getElementById('sticky_id_' + this.id).focus();
  else {
    window.content.document.location.href = url;
    var that = this;
    var focus_sticky = function(e) {
      window.parent
        .removeEventListener('DOMContentLoaded', focus_sticky, false);
      window.parent.content
        .scrollTo(that.left - window.parent.content.innerWidth / 2 ,
                  that.top - window.parent.content.innerHeight / 3);
      var event = { notify: function(timer) {
        window.parent.content.document
          .getElementById('sticky_id_' + that.id).focus();
      }
                  };
      var timer = Components.classes['@mozilla.org/timer;1']
        .createInstance(Components.interfaces.nsITimer);
      timer.initWithCallback(
        event,
        200,
        Components.interfaces.nsITimer.TYPE_ONE_SHOT);
    };
    window.parent.addEventListener('DOMContentLoaded',
                                   focus_sticky,
                                   false);
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
