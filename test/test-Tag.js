const stickynotes = require('../lib/stickynotes');
const test = require("sdk/test");
const TestHelper  = require('./TestHelper');

const params = { id: 100, name: 'test'};

exports['test stickynotes.Tag.create()'] = function(assert, done) {
  TestHelper.runDBTest(assert, done, function() {
    return stickynotes.Tag.create(params).then((tag) => {
      assert.ok(tag != null);
      return stickynotes.Tag.create({ id: 100, name: 'test1'});
    }).then(() => assert.fail('Cannot create tag that has duplicated id'),
            () => assert.pass('Cannot create tag that has duplicated id'))
      .then(() => stickynotes.Tag.create({ id: 101, name: 'test'}))
      .then(() => assert.fail('Cannot create tag that has duplicated name'),
            () => assert.pass('Cannot create tag that has duplicated name'));
  });
};

exports['test stickynotes.Tag.fetchById'] = function(assert, done) {
  TestHelper.runDBTest(assert, done, function() {
    return stickynotes.Tag.create(params)
      .then((tag) => {
        assert.equal(tag.id, 100);
        assert.equal(tag.name, 'test');
      });
  });
};

exports['test stickynotes.Tag.fetchByName'] = function(assert, done) {
  TestHelper.runDBTest(assert, done, function() {
    return stickynotes.Tag.create(params)
      .then((tag) => stickynotes.Tag.fetchByName('test'))
      .then((tag) => {
        assert.equal(tag.id, 100);
        assert.equal(tag.name, 'test');
      });
  });
};

exports['test stickynotes.Tag.fetchAll'] = function(assert, done) {
  TestHelper.runDBTest(assert, done, function() {
    return Promise.resolve()
      .then(    () => stickynotes.Tag.create({ id: 100, name: 'test'}))
      .then(    () => stickynotes.Tag.create({ id: 101, name: 'test1'}))
      .then(    () => stickynotes.Tag.create({ id: 102, name: 'test2'}))
      .then(    () => stickynotes.Tag.fetchAll())
      .then((tags) => assert.equal(tags.length, 3));
  });
};

exports['test stickynotes.Tag.remove'] = function(assert, done) {
  TestHelper.runDBTest(assert, done, function() {
    return Promise.resolve()
      .then(() => stickynotes.Tag.create({ id: 100, name: 'test'}))
      .then(() => stickynotes.Tag.create({ id: 101, name: 'test1'}))
      .then(() => stickynotes.Tag.create({ id: 102, name: 'test2'}))
      .then(() => stickynotes.Tag.fetchAll())
      .then((tags) => tags[0].remove())
      .then(() => stickynotes.Tag.fetchAll())
      .then((tagsAfter) => assert.equal(tagsAfter.length, 2));
  });
};

test.run(exports);
