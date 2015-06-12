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

require("sdk/test").run(exports);
