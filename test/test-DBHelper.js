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

exports['test stickynotes.DBHelper.getDateStr'] = function(assert) {
  var date = new Date(1985, 3, 7, 0, 0, 0, 0);
  var str = stickynotes.DBHelper.getDateStr(date);
  assert.equal('1985-04-07 00:00:00', str);
};

exports['test stickynotes.DBHelper.getCurrentDateStr'] = function(assert) {
  var str = stickynotes.DBHelper.getCurrentDateStr();
  assert.notEqual(null, str);
};

require("sdk/test").run(exports);
