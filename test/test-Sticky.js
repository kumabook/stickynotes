var stickynotes = require('../lib/stickynotes');

var testStickyParam;
var testUrl = 'http://test.stickynotes.co.jp';
var setup = function() {
  stickynotes.DBHelper.dropTables();
  stickynotes.DBHelper.createTables();
  testStickyParam = {
    left: 0, top: 0,
    width: 150, height: 100,
    url: testUrl,
    title: 'title',
    content: 'This is test content',
    color: 'yellow',
    tags: 'tag'
  };
};

var teardown = function() {
  stickynotes.DBHelper.dropTables();
};

exports['test stickynotes.Sticky.create()'] = function(assert) {
  setup();
  var sticky = stickynotes.Sticky.create(testStickyParam);
  assert.ok(sticky, 'test for DBHelper.insertSticky');
  var stickies = stickynotes.Sticky.fetchAll();
  assert.equal(stickies.length, 1, 'test for stickynotes.Page.create');
  assert.throws(
    function() {
      testStickyParam.id = sticky.id;
      stickynotes.Sticky.create(testStickyParam);
    },
    stickynotes.DBHelper.DBAccessError,
    'Cannot add sticky that have duplicated id');
  teardown();
};

exports['test stickynotes.Sticky.fetchById()'] = function(assert) {
  setup();
  var sticky = stickynotes.Sticky.create(testStickyParam);
  var result = stickynotes.Sticky.fetchById(sticky.id);
  assert.equal(sticky.id, result.id, 'test for stickynotes.Sticky.getStickyId');
};

exports['test stickynotes.Sticky.fetchByUrl()'] = function(assert) {
  setup();
  var url1 = 'http://test1.stickynotes.co.jp';
  var url2 = 'http://test2.stickynotes.co.jp';
  var url3 = 'http://test3.stickynotes.co.jp';
  var url4 = 'http://test4.stickynotes.co.jp';
  var prepareStickyParam = function(stickyParam, url) {
    testStickyParam.id = null;
    testStickyParam.url = url;
  };

  prepareStickyParam(testStickyParam, url1);
  stickynotes.Sticky.create(testStickyParam);

  prepareStickyParam(testStickyParam, url2);
  stickynotes.Sticky.create(testStickyParam);

  prepareStickyParam(testStickyParam, url3);
  stickynotes.Sticky.create(testStickyParam);

  assert.equal(1, stickynotes.Sticky.fetchByUrl(url1).length);
  assert.equal(1, stickynotes.Sticky.fetchByUrl(url2).length);
  assert.equal(1, stickynotes.Sticky.fetchByUrl(url3).length);
  assert.equal(0, stickynotes.Sticky.fetchByUrl(url4).length);
  assert.equal(0, stickynotes.Sticky.fetchByUrl(null).length);
};

exports['test stickynotes.Sticky.fetchByPage()'] = function(assert) {
  setup();
  var page = stickynotes.Page.create({
    id: 110, url: testUrl, title: 'testTitle'
  });
  var sticky = stickynotes.Sticky.create(testStickyParam);
  var stickies = stickynotes.Sticky.fetchByPage(page);
  assert.equal(stickies.length, 1, 'test for stickynotes.Page.fetchByPage');
};

exports['test stickynotes.Sticky.fetchAll()'] = function(assert) {
  setup();
  var sticky = stickynotes.Sticky.create(testStickyParam);
  testStickyParam.id = null;
  var sticky2 = stickynotes.Sticky.create(testStickyParam);
  var stickies = stickynotes.Sticky.fetchAll();
  assert.equal(stickies.length, 2, 'test for stickynotes.Page.fetchAll');
};

exports['test stickynotes.Sticky.prototype.save()'] = function(assert) {
  setup();
  var sticky = new stickynotes.Sticky.create(testStickyParam);
  sticky.top = 200;
  sticky.left = 200;
  sticky.width = 200;
  sticky.height = 200;
  sticky.content = 'aaaa';
  sticky.color = 'red';
  sticky.save();
  var newSticky = stickynotes.Sticky.fetchById(sticky.id);
  assert.equal(newSticky.top, 200);
  assert.equal(newSticky.left, 200);
  assert.equal(newSticky.width, 200);
  assert.equal(newSticky.height, 200);
  assert.equal(newSticky.content, 'aaaa');
  assert.equal(newSticky.color, 'red');
};

exports['test stickynotes.Sticky.prototype.remove()'] = function(assert) {
  setup();
  var sticky = new stickynotes.Sticky.create(testStickyParam);
  assert.ok(sticky.remove(), '消せるとTrue');
  var stickies = stickynotes.Sticky.fetchAll();
  assert.equal(0, stickies.length);
  assert.ok(!sticky.remove(), 'ないもの消そうとするとFalse');
};

exports['test stickynotes.Sticky.prototype.getPage()'] = function(assert) {
  setup();
  var page = stickynotes.Page.create({
    id: 110, url: testUrl, title: 'testTitle'
  });
  var sticky = stickynotes.Sticky.create(testStickyParam);
  var page1 = sticky.getPage();
  assert.equal(page1.id, page.id);
  assert.equal(page1.url, page.url);
  assert.equal(page1.title, page.title);
};

exports['test stickynotes.Sticky.prototype.setTags() and getTags()'] = function(assert) {
  setup();
  var sticky = stickynotes.Sticky.create(testStickyParam);
  var tag1 = stickynotes.Tag.create({name: 'tag1'});
  var tag2 = stickynotes.Tag.create({name: 'tag2'});
  var tag3 = stickynotes.Tag.create({name: 'tag3'});
  sticky.setTags(['tag1']);

  var tags = sticky.getTags();
  assert.equal(tags.length, 1);
  assert.equal(tags[0].name, 'tag1');

  sticky.setTags(['tag1', 'tag2']);
  tags = sticky.getTags();
  assert.equal(tags.length, 2);

  sticky.setTags(['tag3']);

  tags = sticky.getTags();
  assert.equal(tags.length, 1);
  assert.equal(tags[0].name, 'tag3');
};


require("sdk/test").run(exports);
