module('stickynotes.Tag', {
    setup: function() {
    stickynotes.DAO.dropTables();
    stickynotes.DAO.createTables();
  },
  teardown: function() {
    stickynotes.DAO.dropTables();
  }
});

test('stickynotes.Tag.create', function(){
  ok(stickynotes.Tag.create({ id: 100, name: "test"}));
  raises(function() {
    stickynotes.Tag.create({ id: 100, name: "test1"});
  }, "DBAccessError");
  raises(function() {
    stickynotes.Tag.create({ id: 101, name: "test"});
  }, "DBAccessError");
});
test('stickynotes.Tag.fetchById', function(){
  stickynotes.Tag.create({ id: 100, name: "test"});
  var tag = stickynotes.Tag.fetchById(100);
  same(tag.id, 100);
  same(tag.name, 'test');
});
test('stickynotes.Tag.fetchByName', function(){
  stickynotes.Tag.create({ id: 100, name: 'test'});
  var tag = stickynotes.Tag.fetchByName('test');
  same(tag.id, 100);
  same(tag.name, 'test');
});

test('stickynotes.Tag.fetchAll', function(){
  stickynotes.Tag.create({ id: 100, name: 'test'});
  stickynotes.Tag.create({ id: 101, name: 'test1'});
  stickynotes.Tag.create({ id: 102, name: 'test2'});
  var tags = stickynotes.Tag.fetchAll();
  same(tags.length, 3);
});

test('stickynotes.Tag.remove', function(){
  stickynotes.Tag.create({ id: 100, name: 'test'});
  stickynotes.Tag.create({ id: 101, name: 'test1'});
  stickynotes.Tag.create({ id: 102, name: 'test2'});
  var tags = stickynotes.Tag.fetchAll();
  tags[0].remove();
  var tagsAfter = stickynotes.Tag.fetchAll();
  same(tagsAfter.length, 2);
});

test('stickynotes.Tag.', function(){

  
});

test('stickynotes.Tag.fetchByPage', function(){
});