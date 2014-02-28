var stickynotes = require('./stickynotes');
var setup = function() {
  stickynotes.DBHelper.dropTables();
  stickynotes.DBHelper.createTables();
};

var teardown = function() {
  stickynotes.DBHelper.dropTables();
};

exports['test get database connection'] = function(assert) {
  setup();
  var con = stickynotes.DBHelper.getDBConn();
  assert.ok(con != null, 'get dbconnection');
};

require("sdk/test").run(exports);
