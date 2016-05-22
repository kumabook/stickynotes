const stickynotes = require('../lib/stickynotes');
const TestHelper  = require('./TestHelper');

const params  = { id: 100, url: 'http://test.jp' , title: 'test page'};
const params2 = { id: 101, url: 'http://test1.jp', title: 'test1 page'};

exports['test stickynotes.Page.create'] = function(assert, done) {
  TestHelper.runDBTest(assert, done, function() {
    return stickynotes.Page.create(params).then((page) => {
      assert.ok(page != null);
      return stickynotes.Page.create(params);
    }).then(() => {
      assert.fail('Cannot create page that has duplicated id');
    }, () => {
      assert.ok('Cannot create page that has duplicated id');
    });
  });
};

exports['test stickynotes.Page.fetchById()'] = function(assert, done) {
  TestHelper.runDBTest(assert, done, function() {
    return stickynotes.Page.create(params).then(() => {
      return stickynotes.Page.fetchById(params.id);
    }).then((page) => {
      assert.equal(100, page.id);
      assert.equal('http://test.jp', page.url);
      assert.equal('test page' , page.title);
    });
  });
};

exports['test stickynotes.Page.fetchByUrl()'] = function(assert, done) {
  TestHelper.runDBTest(assert, done, function() {
    return Promise.resolve()
      .then(() => stickynotes.Page.create(params))
      .then(() => stickynotes.Page.create(params2))
      .then(() => stickynotes.Page.fetchByUrl('http://test.jp'))
      .then((page) => {
        assert.equal(100, page.id);
        assert.equal('http://test.jp', page.url);
        assert.equal('test page' , page.title);
        return stickynotes.Page.fetchByUrl('http://nourl.jp');
      }).then((nopage) => {
        assert.equal(null, nopage, 'return null unexist url');
      });
  });
};

exports['test stickynotes.Page.fetchAll()'] = function(assert, done) {
  TestHelper.runDBTest(assert, done, function() {
    return stickynotes.Page.fetchAll().then((pages) => {
      assert.equal(0, pages.length);
      return stickynotes.Page.create(params);
    }).then(() => {
      return stickynotes.Page.fetchAll();
    }).then((pages) => {
      assert.equal(1, pages.length);
      return stickynotes.Page.create(params2);
    }).then(() => {
      return stickynotes.Page.fetchAll();
    }).then((pages) => {
      assert.equal(2, pages.length);
      assert.equal(100, pages[0].id);
      assert.equal('http://test.jp', pages[0].url);
      assert.equal('test page' , pages[0].title);
    });
  });
};

require("sdk/test").run(exports);
