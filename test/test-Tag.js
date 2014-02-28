var stickynotes = require('./stickynotes');
var test = require("sdk/test");

var setup = function() {
  stickynotes.DAO.dropTables();
  stickynotes.DAO.createTables();
};

var teardown = function() {
  stickynotes.DAO.dropTables();
};

exports['test stickynotes.Tag.create()'] = function(assert) {
  setup();
  var tag = stickynotes.Tag.create({ id: 100, name: 'test'});
  assert.ok(tag != null);
  assert.throws(function() {
    stickynotes.Tag.create({ id: 100, name: 'test1'});
  }, stickynotes.DAO.DBAccessError);
  assert.throws(function() {
    stickynotes.Tag.create({ id: 101, name: 'test'});
  }, stickynotes.DAO.DBAccessError);
};

exports['test stickynotes.Tag.fetchById'] = function(assert) {
  setup();
  stickynotes.Tag.create({ id: 100, name: 'test'});
  var tag = stickynotes.Tag.fetchById(100);
  assert.equal(tag.id, 100);
  assert.equal(tag.name, 'test');
};

exports['test stickynotes.Tag.fetchByName'] = function(assert) {
  setup();
  stickynotes.Tag.create({ id: 100, name: 'test'});
  var tag = stickynotes.Tag.fetchByName('test');
  assert.equal(tag.id, 100);
  assert.equal(tag.name, 'test');
};

exports['test stickynotes.Tag.fetchAll'] = function(assert) {
  setup();
  stickynotes.Tag.create({ id: 100, name: 'test'});
  stickynotes.Tag.create({ id: 101, name: 'test1'});
  stickynotes.Tag.create({ id: 102, name: 'test2'});
  var tags = stickynotes.Tag.fetchAll();
  assert.equal(tags.length, 3);
};

exports['test stickynotes.Tag.remove'] = function(assert) {
  setup();
  stickynotes.Tag.create({ id: 100, name: 'test'});
  stickynotes.Tag.create({ id: 101, name: 'test1'});
  stickynotes.Tag.create({ id: 102, name: 'test2'});
  var tags = stickynotes.Tag.fetchAll();
  tags[0].remove();
  var tagsAfter = stickynotes.Tag.fetchAll();
  assert.equal(tagsAfter.length, 2);
};

test.run(exports);
