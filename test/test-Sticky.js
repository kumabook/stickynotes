const stickynotes = require('../lib/stickynotes');
const TestHelper  = require('./TestHelper');

const testUrl = 'http://test.stickynotes.co.jp';
const testStickyParam = (options) => {
  return Object.assign({}, {
    left: 0, top: 0,
    width: 150, height: 100,
    url: testUrl,
    title: 'title',
    content: 'This is test content',
    color: 'yellow',
    tags: ['tag']
  }, options);
};

exports['test stickynotes.Sticky.create()'] = function(assert, done) {
  TestHelper.runDBTest(assert, done, function() {
    return stickynotes.Sticky.create(testStickyParam()).then((sticky) => {
      assert.pass(sticky, 'test for DBHelper.insertSticky');
      return stickynotes.Sticky.fetchAll().then((stickies) => {
        assert.equal(stickies.length, 1, 'test for stickynotes.Page.create');
        return stickynotes.Sticky.create(testStickyParam({id: sticky.id})).then(
          () => {
            assert.fail('sould not create sticky that have duplicated id');
          },
          (e) => {
            assert.pass('shoud not create sticky that have duplicated id');
          });
      });
    });
  });
};

exports['test stickynotes.Sticky.fetchByUUID()'] = function(assert, done) {
  TestHelper.runDBTest(assert, done, function() {
    return stickynotes.Sticky.create(testStickyParam()).then((sticky) => {
      return stickynotes.Sticky.fetchByUUID(sticky.uuid).then(
        (result) => {
          assert.equal(sticky.uuid, result.uuid,
                       'test for stickynotes.Sticky.getStickyUUID');
        });
      });
  });
};

exports['test stickynotes.Sticky.fetchByUrl()'] = function(assert, done) {
  const url1 = 'http://test1.stickynotes.co.jp';
  const url2 = 'http://test2.stickynotes.co.jp';
  const url3 = 'http://test3.stickynotes.co.jp';
  const url4 = 'http://test4.stickynotes.co.jp';
  function prepareStickyParam(url) {
    testStickyParam.id = null;
    testStickyParam.url = url;
  };
  TestHelper.runDBTest(assert, done, function() {
    return Promise.resolve().then(() => {
      return stickynotes.Sticky.create(testStickyParam({url: url1}));
    }).then(() => {
      prepareStickyParam(url2);
      return stickynotes.Sticky.create(testStickyParam({url: url2}));
    }).then(() => {
      prepareStickyParam(url3);
      return stickynotes.Sticky.create(testStickyParam({url: url3}));
    }).then(() => {
      return stickynotes.Sticky.fetchByUrl(url1);
    }).then((stickies) => {
      assert.ok(stickies.length > 0, 'should find sticky by url');
      return stickynotes.Sticky.fetchByUrl(url2);
    }).then((stickies) => {
      assert.ok(stickies.length > 0, 'should find sticky by url');
      return stickynotes.Sticky.fetchByUrl(url3);
    }).then((stickies) => {
      assert.ok(stickies.length > 0, 'should find sticky by url');
      return stickynotes.Sticky.fetchByUrl(url4);
    }).then((stickies) => {
      assert.ok(stickies.length === 0, 'should find sticky by url');
      return stickynotes.Sticky.fetchByUrl(null);
    }).then((stickies) => {
      assert.ok(stickies.length === 0, 'should find sticky by url');
    });
  });
};

exports['test stickynotes.Sticky.fetchByPage()'] = function(assert, done) {
  let page;
  TestHelper.runDBTest(assert, done, function() {
    return Promise.resolve().then(() => {
      return stickynotes.Page.create({
        id: 110, url: testUrl, title: 'testTitle'
      });
    }).then((_page) => {
      page = _page;
      return stickynotes.Sticky.create(testStickyParam());
    }).then((_sticky) => {
      return stickynotes.Sticky.fetchByPage(page);
    }).then((stickies) => {
      assert.equal(stickies.length, 1, 'test for stickynotes.Page.fetchByPage');
    });
  });
};

exports['test stickynotes.Sticky.fetchAll()'] = function(assert, done) {
  let sticky, sticky2;
  TestHelper.runDBTest(assert, done, function() {
    return Promise.resolve().then(() => {
      return stickynotes.Sticky.create(testStickyParam());
    }).then((sticky) => {
      return stickynotes.Sticky.create(testStickyParam());
    }).then((sticky2) => {
      return stickynotes.Sticky.fetchAll();
    }).then((stickies) => {
      assert.equal(stickies.length, 2, 'test for stickynotes.Page.fetchAll');
    });
  });
};

exports['test stickynotes.Sticky.prototype.save()'] = function(assert, done) {
  let sticky;
  TestHelper.runDBTest(assert, done, function() {
    return Promise.resolve().then(() => {
      return stickynotes.Sticky.create(testStickyParam());
    }).then((_sticky) => {
      sticky         = _sticky;
      sticky.top     = 200;
      sticky.left    = 200;
      sticky.width   = 200;
      sticky.height  = 200;
      sticky.content = 'aaaa';
      sticky.color   = 'red';
      return sticky.save();
    }).then(() => {
      return stickynotes.Sticky.fetchByUUID(sticky.uuid);
    }).then((newSticky) => {
      assert.equal(newSticky.top    , 200);
      assert.equal(newSticky.left   , 200);
      assert.equal(newSticky.width  , 200);
      assert.equal(newSticky.height , 200);
      assert.equal(newSticky.content, 'aaaa');
      assert.equal(newSticky.color  , 'red');
    });
  });
};

exports['test stickynotes.Sticky.prototype.remove()'] = function(assert, done) {
  let sticky;
  TestHelper.runDBTest(assert, done, function() {
    return Promise.resolve().then(() => {
      return stickynotes.Sticky.create(testStickyParam());
    }).then((_sticky) => {
      sticky = _sticky;
      return sticky.remove();
    }).then(() => {
      assert.pass('Remove successfully');
      return stickynotes.Sticky.fetchAll();
    }).then((stickies) => {
      assert.equal(0, stickies.length);
      return sticky.remove();
    }).then((result) => {
      assert.fail('Canoot remove unexist sticky');
    }).catch((e) => {
      assert.pass('Canoot remove unexist sticky');
    });
  });
};

exports['test stickynotes.Sticky.prototype.getPage()'] = function(assert, done) {
  let sticky;
  let page;
  TestHelper.runDBTest(assert, done, function() {
    return Promise.resolve().then(() => {
      return stickynotes.Page.create({
        id: 110, url: testUrl, title: 'testTitle'
      });
    }).then((_page) => {
      page = _page;
      return stickynotes.Sticky.create(testStickyParam());
    }).then((sticky) => {
      return sticky.fetchPage();
    }).then((sticky) => {
      let p = sticky.getPage();
      assert.equal(p.id   , page.id);
      assert.equal(p.url  , page.url);
      assert.equal(p.title, page.title);
      return true;
    });
  });
};

exports['test stickynotes.Sticky.prototype.setTags() and getTags()'] = function(assert, done) {
  let sticky;
  let page;
  TestHelper.runDBTest(assert, done, function() {
    return Promise.resolve().then(() => {
      return stickynotes.Sticky.create(testStickyParam);
    }).then((_sticky) => {
      sticky = _sticky;
      return Promise.all([stickynotes.Tag.create({name: 'tag1'}),
                          stickynotes.Tag.create({name: 'tag2'}),
                          stickynotes.Tag.create({name: 'tag3'})]);
    }).then(() => {
      return sticky.setTags(['tag1']);
    }).then(() => {
      return sticky.getTags();
    }).then((tags) => {
      assert.equal(tags.length, 1, 'Can set a tag');
      assert.equal(tags[0].name, 'tag1', 'Can set a tag');
      return true;
    }).then(() => {
      return sticky.setTags(['tag1', 'tag2']);
    }).then(() => {
      return sticky.getTags();
    }).then((tags) => {
      assert.equal(tags.length, 2, 'Change tags');
      return sticky.setTags(['tag3']);
    }).then(() => {
      return sticky.getTags();
    }).then((tags) => {
      assert.equal(tags.length, 1, 'Change tags');
      assert.equal(tags[0].name, 'tag3', 'Change tags');
      return true;
    });
  });
};

exports['test stickynotes.Sticky.prototype.fetchUpdatedStickiesSince()'] = function(assert, done) {
  let sticky;
  let page;
  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const tomorrow = new Date();
  tomorrow.setDate(now.getDate() + 1);
  const prepareStickyParam = function(date) {
    return testStickyParam({
      created_at: date.toISOString(),
      updated_at: date.toISOString()
    });
  };
  TestHelper.runDBTest(assert, done, function() {
    return Promise.resolve()
      .then(() => stickynotes.Sticky.create(prepareStickyParam(now)))
      .then(() => stickynotes.Sticky.create(prepareStickyParam(yesterday)))
      .then(() => stickynotes.Sticky.create(prepareStickyParam(yesterday)))
      .then(() => stickynotes.Sticky.create(prepareStickyParam(tomorrow)))
      .then(() => stickynotes.Sticky.create(prepareStickyParam(tomorrow)))
      .then(() => {
      return stickynotes.Sticky.create(prepareStickyParam(tomorrow));
    }).then(() => {
      return stickynotes.Sticky.fetchUpdatedStickiesSince(now);
    }).then((stickies) => {
      assert.equal(4, stickies.length, 'fetch only since now');
      return stickynotes.Sticky.fetchUpdatedStickiesSince(yesterday);
    }).then((stickies) => {
      assert.equal(6, stickies.length, 'fetch only since yesterday');
      return stickynotes.Sticky.fetchUpdatedStickiesSince(tomorrow);
    }).then((stickies) => {
      assert.equal(3, stickies.length, 'fetch only since tomrrow');
    });
  });
};

require("sdk/test").run(exports);
