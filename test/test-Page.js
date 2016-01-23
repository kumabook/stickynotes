var stickynotes = require('../lib/stickynotes');
var setup = function() {
  stickynotes.DBHelper.dropTables();
  stickynotes.DBHelper.createTables();
};

var teardown = function() {
  stickynotes.DBHelper.dropTables();
};

exports['test stickynotes.Page.create'] = function(assert) {
  setup();
  var page = stickynotes.Page.create({
    id: 100,
    url: 'http://test.jp',
    title: 'test page'});
  assert.ok(page != null);
  assert.throws(
    function() {
      stickynotes.Page.create({
        id: 100,
        url: 'http://test.jp',
        title: 'test page'
      });
    },
    stickynotes.DBHelper.DBAccessError);
};

exports['test stickynotes.Page.fetchById()'] = function(assert) {
  setup();
  stickynotes.Page.create(
    { id: 100, url: 'http://test.jp', title: 'test page'});
  var page = stickynotes.Page.fetchById(100);
  assert.equal(100, page.id);
  assert.equal('http://test.jp', page.url);
  assert.equal('test page' , page.title);
};

exports['test stickynotes.Page.fetchByUrl()'] = function(assert) {
  setup();
  stickynotes.Page.create(
    { id: 100, url: 'http://test.jp', title: 'test page'});
  stickynotes.Page.create(
    { id: 101, url: 'http://test1.jp', title: 'test1 page'});

  var page = stickynotes.Page.fetchByUrl('http://test.jp');
  assert.equal(100, page.id);
  assert.equal('http://test.jp', page.url);
  assert.equal('test page' , page.title);
  var nopage = stickynotes.Page.fetchByUrl('http://nourl.jp');
  assert.equal(null, nopage, 'return null unexist url');
};

exports['test stickynotes.Page.fetchAll()'] = function(assert) {
  setup();
  var pages = stickynotes.Page.fetchAll();
  assert.equal(0, pages.length);

  stickynotes.Page.create({ id: 100, url: 'http://test.jp', title: 'test page'});
  pages = stickynotes.Page.fetchAll();
  assert.equal(1, pages.length);
  stickynotes.Page.create({ id: 101, url: 'http://test1.jp', title: 'test1 page'});

  pages = stickynotes.Page.fetchAll();
  assert.equal(2, pages.length);

  assert.equal(100, pages[0].id);
  assert.equal('http://test.jp', pages[0].url);
  assert.equal('test page' , pages[0].title);

  assert.throws(
    function() {
      stickynotes.Page.create({
        id: 101,
        url: 'http://test1.jp',
        title: 'test page'
      });
    },
    stickynotes.DBHelper.DBAccessError);
};

require("sdk/test").run(exports);
