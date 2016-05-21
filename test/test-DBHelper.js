var stickynotes = require('../lib/stickynotes');
var setup = function() {
  let c;
  return stickynotes.DBHelper.connection().then((_c) => {
    c = _c;
    return stickynotes.DBHelper.createTables(c);
  }).then(() => {
    return c;
  });
};

var teardown = function(c) {
  return stickynotes.DBHelper.dropTables(c).then(() => c.close());
};

exports['test get database connection'] = function(assert) {
  return  stickynotes.DBHelper.connection().then((c) => {
    assert.ok(c != null, 'get dbconnection');
    return c.close();
  });
};

exports['test stickynotes.DBHelper.migrate'] = function(assert) {
  let c;
  setup().then((_c) => {
    c = _c;
    return stickynotes.DBHelper.getVersion(c);
  }).then((version) => {
    assert.equal(0, version);
    return stickynotes.DBHelper.migrate(c);
  }).then(() => {
    return stickynotes.DBHelper.getVersion(c);
  }).then((version) => {
    assert.equal(1, version);
    return teardown(c);
  });
};

exports['test stickynotes.DBHelper.uuid'] = function(assert) {
  var uuid1 = stickynotes.DBHelper.uuid();
  var uuid2 = stickynotes.DBHelper.uuid();
  assert.equal(36, uuid1.length);
  assert.notEqual(uuid1, uuid2);
};

require("sdk/test").run(exports);
