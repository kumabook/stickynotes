module('stickynotes.Page', {
  setup: function() {
    stickynotes.DAO.dropTables();
    stickynotes.DAO.createTables();
  },
  teardown: function() {
    stickynotes.DAO.dropTables();
  }
});

test('stickynotes.Page.create', function() {
  ok(stickynotes.Page.create(
    { id: 100, url: "http://test.jp", title: "test page"}));
  raises(
    function() {
      stickynotes.Page.create({ id: 100, url: "http://test.jp", title: "test page"});
    },
    "DBAccessError");
});

test('stickynotes.Page.fetchById()', function() {
  stickynotes.Page.create(
    { id: 100, url: "http://test.jp", title: "test page"});
  var page = stickynotes.Page.fetchById(100);
  same(100, page.id);
  same("http://test.jp", page.url);
  same("test page" , page.title);
});

test('stickynotes.Page.fetchByUrl()', function() {
  stickynotes.Page.create(
    { id: 100, url: "http://test.jp", title: "test page"});
  stickynotes.Page.create(
    { id: 101, url: "http://test1.jp", title: "test1 page"});
  
  var page = stickynotes.Page.fetchByUrl("http://test.jp");
  same(100, page.id);
  same("http://test.jp", page.url);
  same("test page" , page.title);
  var nopage = stickynotes.Page.fetchByUrl("http://nourl.jp");
  same(null, nopage, 'return null unexist url');
});

test('stickynotes.Page.fetchAll()', function() {
  var pages = stickynotes.Page.fetchAll();
  same(0, pages.length);
  
  stickynotes.Page.create({ id: 100, url: "http://test.jp", title: "test page"});
  pages = stickynotes.Page.fetchAll();
  same(1, pages.length);
  stickynotes.Page.create({ id: 101, url: "http://test1.jp", title: "test1 page"});
  
  pages = stickynotes.Page.fetchAll();
  same(2, pages.length);
  
  same(100, pages[0].id);
  same("http://test.jp", pages[0].url);
  same("test page" , pages[0].title);
  
  raises(function() {
    stickynotes..insertPage(
      { id: 101, url: "http://test1.jp", title: "test page"}
    ), 'DBAccessError'});
});
