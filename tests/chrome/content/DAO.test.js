stickynotes.DAO.dbName = 'stickynotes_test';
module('module DAO', {
  setup: function() {
    stickynotes.DAO.dropTables();
    stickynotes.DAO.createTables();
  },
  teardown: function() {
    stickynotes.DAO.dropTables();
  }
});
test('get database connection', function() {
  var con = stickynotes.DAO.getDBConn();
  ok(con, 'get dbconnection');
});




test('GetStickiesByPageId()', function() {
  var sticky1 = new stickynotes.Sticky(
    { id: 1, url: 'http://test1',
      top: 100, left: 100, width: 100, height: 100,
	  content: 'test1', color: 'yellow', tag: 'test' });
  stickynotes.DAO.insertSticky(sticky1);
  var sticky2 = new stickynotes.Sticky(
    { id: 2, url: 'http://test2',
      top: 100, left: 100, width: 100, height: 100,
	  content: 'test2', color: 'yellow', tag: 'test' });
  stickynotes.DAO.insertSticky(sticky2);
  var sticky3 = new stickynotes.Sticky(
    { id: 3, url: 'http://test3',
      top: 100, left: 100, width: 100, height: 100,
	  content: 'test3', color: 'yellow', tag: 'test' });
  stickynotes.DAO.insertSticky(sticky3);
  var page_id = stickynotes.DAO.getPageByUrl('http://test1').id;
  var stickies = stickynotes.DAO.getStickiesByPageId(page_id);

  same(1, stickies.length);
});

test('Row2Obj()', function() {
  var url = 'http://test.jp';
  var obj = { id: 100, url: url, title: 'test page'};
  stickynotes.DAO.insertPage(obj);
  var dbConn = stickynotes.DAO.getDBConn();
  var sql = "SELECT * FROM page WHERE url = '" + url + "'";
  var page = null;
  dump(sql + '\n');
  var statement = dbConn.createStatement(sql);
  while (statement.executeStep()) {
	var _obj = stickynotes.DAO.row2Obj(statement.row, ['id', 'url', 'title']);
	same(obj.id, _obj.id);
	same(obj.url, _obj.url);
	same(obj.title, _obj.title);
  }
  statement.finalize();
  dbConn.close();
});

