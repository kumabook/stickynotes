module('stickynotes.Sticky', {
  setup: function() {
    stickynotes.DAO.dropTables();
    stickynotes.DAO.createTables();
  },
  teardown: function() {
    stickynotes.DAO.dropTables();
  }
});

test('stickynotes.Sticky.create()', function() {
  var sticky = new stickynotes.Sticky.create(
    { 
      url: "http://test"
    });
  ok(sticky, 'test for DAO.insertSticky');
  var stickies = stickynotes.Sticky.fetchAll();
  same(stickies.length, 1, 'test for stickynotes.Page.create');
  raises((function() { stickynotes.Sticky.create(sticky);}),
        'DBAccessError','同じIDの付箋は二度いれようとするとエラー');
});

test('stickynotes.Sticky.fetchById()', function() {
  var sticky = new stickynotes.Sticky.create(
    { id: 2, url: "http://test.jp", title: 'testTitle',
      top: 100, left: 100,
      width: 100, height: 100,
	  content: "test", color: "yellow"
    });
  var result = stickynotes.Sticky.fetchById(2);
  same(sticky.id, result.id, 'test for DAO.getStickyId');
});

test('stickynotes.Sticky.fetchByPage()', function() {
  var page = stickynotes.Page.create({
    id: 110, url: 'http://test.jp', title: 'testTitle'
  });
  var sticky = new stickynotes.Sticky.create(
    { id: 2, url: "http://test.jp",
      top: 100, left: 100,
      width: 100, height: 100,
	  content: "test", color: "yellow"
    });
  var stickies = stickynotes.Sticky.fetchByPage(page);
  same(stickies.length, 1, 'test for stickynotes.Page.fetchByPage');
});

test('stickynotes.Sticky.fetchAll()', function() {
  var sticky = new stickynotes.Sticky.create(
    { id: 2, url: "http://test.jp", title: 'testTitle',
      top: 100, left: 100,
      width: 100, height: 100,
	  content: "test", color: "yellow"
    });

    var sticky2 = new stickynotes.Sticky.create(
    { id: 3, url: "http://test.jp", title: 'testTitle',
      top: 100, left: 100,
      width: 100, height: 100,
	  content: "test", color: "yellow"
    });
  var stickies = stickynotes.Sticky.fetchAll();
  same(stickies.length, 2, 'test for stickynotes.Page.fetchAll');
});

test('stickynotes.Sticky.prototype.save()', function() {
  var sticky = new stickynotes.Sticky.create(
    { id: 1,
      url: "http://test",
      top: 100, left: 100,
      width: 100, height: 100, 
	  content: "test", color: "yellow", tag : "test"
    });
  sticky.top = 200;
  sticky.left = 200;
  sticky.width = 200;
  sticky.height = 200;
  sticky.content = 'aaaa';
  sticky.color = 'red';
  sticky.save();
  var newSticky = stickynotes.Sticky.fetchById(1);
  same(newSticky.top, 200);
  same(newSticky.left, 200);
  same(newSticky.width, 200);
  same(newSticky.height, 200);
  same(newSticky.content, 'aaaa');
  same(newSticky.color, 'red');
});

test('stickynotes.Sticky.fetchAll()', function() {
  var sticky = new stickynotes.Sticky.create(
    { id: 2, url: "test", title: 'test',
      top: 100, left: 100,
      width: 100, height: 100,
	  content: "test", color: "yellow", tag : "test"
    });
  var result = stickynotes.Sticky.fetchAll();
  same(1, result.length, 'stickies size');
});

test('stickynotes.Sticky.prototype.remove()', function() {
  var sticky = new stickynotes.Sticky.create(
    { id: 3, url: "http://test", title: 'test',
      top: 100, left: 100,
      width: 100, height: 100, 
	  content: "test", color: "yellow", tag : "test"
    });
  ok(sticky.remove(), '消せるとTrue');
  var stickies = stickynotes.Sticky.fetchAll();
  same(0, stickies.length);
  ok(!sticky.remove(), 'ないもの消そうとするとFalse');
});


test('stickynotes.Sticky.prototype.save()', function() {
  var sticky = new stickynotes.Sticky.create(
    { id: 1, url: "http://test", title: 'test',
      top: 100, left: 100,
      width: 100, height: 100, 
	  content: "test", color: "yellow", tag : "test" });
  sticky.content = "change!";
  sticky.save();
  same(sticky.content, stickynotes.Sticky.fetchById(sticky.id).content);
});

test('stickynotes.Sticky.prototype.getPage()', function(){
  var page = stickynotes.Page.create({
    id: 110, url: 'http://test.jp', title: 'testTitle'
  });
  var sticky = stickynotes.Sticky.create(
    { id: 1, url: "http://test.jp",
      top: 100, left: 100,
      width: 100, height: 100, 
	  content: "test", color: "yellow", tag : "test" });
  var page1 = sticky.getPage();
  same(page1.id, page.id);
  same(page1.url, page.url);
  same(page1.title, page.title);
});

test('stickynotes.Sticky.prototype.setTags() and getTags()', function() {
  var sticky = stickynotes.Sticky.create(
    { id: 1, url: "http://test.jp",
      top: 100, left: 100,
      width: 100, height: 100, 
	  content: "test", color: "yellow", tag : "test" });
  var tag1 = stickynotes.Tag.create({name: 'tag1'});
  var tag2 = stickynotes.Tag.create({name: 'tag2'});
  var tag3 = stickynotes.Tag.create({name: 'tag3'});
  sticky.setTags(['tag1']);

  var tags = sticky.getTags();
  same(tags.length, 1);
  same(tags[0].name, 'tag1');

  sticky.setTags(['tag1', 'tag2']);
  tags = sticky.getTags();
  same(tags.length, 2);

  sticky.setTags(['tag3']);

  tags = sticky.getTags();
  same(tags.length, 1);
  same(tags[0].name, 'tag3');
});

