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

stickynotes.Tag.keys = ['id', 'name'];

stickynotes.Tag.trimWhiteSpace = function(str) {
  return str.replace(/^[\s　]+|[\s　]+$/g, '');
};

stickynotes.Tag.create = function(param) {
  param.name = stickynotes.Tag.trimWhiteSpace(param.name);
  if (!param.id) {
    param.id = stickynotes.DBHelper.genId();
  }
  const sql    = 'INSERT INTO tag VALUES(:id, :name)';
  const params = { id: param.id, name: param.name };
  return stickynotes.DBHelper.execute(sql, params)
    .then(() => {
      return new stickynotes.Tag(params);
    });
};

stickynotes.Tag.fetch = function(sql, params) {
  return stickynotes.DBHelper.fetch(stickynotes.Tag, sql, params);
};

stickynotes.Tag.fetchAll = function() {
  const sql = 'SELECT * FROM tag';
  return this.fetch(sql).then((l) => l.sort((a, b) => a.name > b.name));
};


stickynotes.Tag.findOrCreateByName = function(name) {
  return stickynotes.Tag.fetchByName(name).then(((tag) => {
    if (!tag) {
      return stickynotes.Tag.create({name: name});
    }
    return tag;
  }));
};

stickynotes.Tag.fetchById = function(id) {
  const sql    = 'SELECT * FROM tag WHERE id=:tag_id';
  const params = { tag_id: id };
  return this.fetch(sql, params).then((l) => l.find((p) => p.id === id));
};

stickynotes.Tag.fetchByName = function(name) {
  name = name.replace(/^[\s　]+|[\s　]+$/g, '');
  const sql    = 'SELECT * FROM tag WHERE name=:name';
  const params = { name: name };
  return this.fetch(sql, params).then((l) => l.find((p) => p.name === name));
};

stickynotes.Tag.prototype.remove = function() {
  const sql    = 'DELETE from tag where id=:tag_id';
  const params = { tag_id: this.id };
  return stickynotes.DBHelper.execute(sql, params);
};
/**
 * Get stickies.
 */
stickynotes.Tag.prototype.getStickies = function() {
  const S = stickynotes.Sticky;
  const sql = 'SELECT * FROM sticky_tag WHERE tag_id=:tag_id';
  const DBHelper = stickynotes.DBHelper;
  const row2Obj  = DBHelper.row2Obj;
  return stickynotes.DBHelper.execute(sql, { tag_id: this.id })
    .then((rows) => rows.map((row) => row2Obj(row, ['id', 'sticky_id'])))
    .then((objs) => Promise.all(objs.map((obj) => S.fetchById(obj.sticky_id))));
};
module.exports = stickynotes.Tag;
