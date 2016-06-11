const stickynotes = require('../lib/stickynotes');
const TestHelper  = require('./TestHelper');

exports['test get database connection'] = function(assert) {
  return stickynotes.DBHelper.connection().then((c) => {
    assert.ok(c != null, 'get dbconnection');
    return c.close();
  });
};

exports['test stickynotes.DBHelper.migrate'] = function(assert, done) {
  TestHelper.runDBMigrationTest(assert, done, function() {
    return stickynotes.DBHelper.connection().then((c) => {
      return stickynotes.DBHelper.getVersion(c).then((version) => {
        assert.equal(0, version);
        return stickynotes.DBHelper.migrate(c);
      }).then(() => {
        return stickynotes.DBHelper.getVersion(c);
      }).then((version) => {
        assert.equal(2, version);
        return true;
      }).then(() => {
        c.close();
      }, () => {
        c.close();
      });
    });
  }, true);
};

exports['test stickynotes.DBHelper.uuid'] = function(assert) {
  const uuid1 = stickynotes.DBHelper.uuid();
  const uuid2 = stickynotes.DBHelper.uuid();
  assert.equal(36, uuid1.length);
  assert.notEqual(uuid1, uuid2);
};

require("sdk/test").run(exports);
