var stickynotes = require('../lib/stickynotes');
var setup = function() {
  stickynotes.DBHelper.createTables();
};

var teardown = function() {
  stickynotes.DBHelper.dropTables();
};

exports['test get database connection'] = function(assert) {
  setup();
  var con = stickynotes.DBHelper.getDBConn();
  assert.ok(con != null, 'get dbconnection');
  teardown();
};

exports['test stickynotes.DBHelper.migrate'] = function(assert) {
  setup();
  assert.equal(0, stickynotes.DBHelper.getVersion());
  stickynotes.DBHelper.migrate();
  assert.equal(1, stickynotes.DBHelper.getVersion());
  teardown();
};

exports['test stickynotes.DBHelper.uuid'] = function(assert) {
  var uuid1 = stickynotes.DBHelper.uuid();
  var uuid2 = stickynotes.DBHelper.uuid();
  assert.equal(36, uuid1.length);
  assert.notEqual(uuid1, uuid2);
};

require("sdk/test").run(exports);
