var stickynotes = require('./stickynotes');
var setup = function() {
  stickynotes.DAO.dropTables();
  stickynotes.DAO.createTables();
};

var teardown = function() {
  stickynotes.DAO.dropTables();
};

exports['test get database connection'] = function(assert) {
  setup();
  var con = stickynotes.DAO.getDBConn();
  assert.ok(con != null, 'get dbconnection');
};

require("sdk/test").run(exports);
