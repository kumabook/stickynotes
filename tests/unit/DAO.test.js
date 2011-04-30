var priority = "must";
var baseURL = "../../src/chrome/content/";
utils.include({url : baseURL + "DAO.js"});
utils.include({url : baseURL + "Sticky.js"});
var description = 'test_for_DAO';

function setUp() {    
    DAO.dropTables();
    DAO.createTables();
//    DAO.createTables();
}

function tearDown() {
    DAO.dropTables();
}

function testInsertSticky() {
    var sticky = new Sticky({ id: 1, url: "http://test", top: 100, left: 100, width: 100, height: 100, 
			      content: "test", color: "yellow", tag : "test" });
    assertTrue(DAO.insertSticky(sticky));
    assertRaise('DBAccessError', (function() { DAO.insertSticky(sticky);}), this); //同じIDの付箋は二度いれようとするとエラー

}
testInsertSticky.description = 'test for DAO.insertSticky';


function testGetStickyById(){
    var sticky = new Sticky({ id: 2, url: "test", top: 100, left: 100, width: 100, height: 100, 
			      content: "test", color: "yellow", tag : "test" });

    DAO.insertSticky(sticky);
    var result = DAO.getStickyById(2);
    assertEquals(sticky.id, result.id);
}
testGetStickyById.description = 'test for DAO.getStickyId';

function testDeleteSticky() {
    var sticky = new Sticky({ id: 3, url: "http://test",top: 100, left: 100, width: 100, height: 100, 
			      content: "test", color: "yellow", tag : "test" });
    DAO.insertSticky(sticky);
    assertTrue(DAO.deleteSticky(sticky)); // 消せるとTrue
    assertFalse(DAO.deleteSticky(sticky)); //ないもの消そうとするとFalse

}
testDeleteSticky.description = 'test for DAO.deleteSticky';


function testUpdateSticky(){
    var sticky = new Sticky({ id: 1, url: "http://test",top: 100, left: 100, width: 100, height: 100, 
			      content: "test", color: "yellow", tag : "test" });
    DAO.insertSticky(sticky);
    sticky.content = "change!";
    DAO.updateSticky(sticky);
    assertEquals(sticky.content, DAO.getStickyById(sticky.id).content);

}
testUpdateSticky.description = 'test for DAO.updateSticky';

function testInsertPage(){
    assertTrue(DAO.insertPage({ id: 100, url: "http://test.jp", title: "test page"}));
    assertRaise("DBAccessError", (function(){ DAO.insertPage({ id: 100, url: "http://test.jp", title: "test page"});}));
}
testInsertPage.description = 'test for DAO.insertPage';

function testGetPages(){
    var pages = DAO.getPages();
    assertEquals(0, pages.length);

    DAO.insertPage({ id: 100, url: "http://test.jp", title: "test page"});
    pages = DAO.getPages();
    assertEquals(1, pages.length);
    DAO.insertPage({ id: 101, url: "http://test1.jp", title: "test1 page"});

    pages = DAO.getPages();
    assertEquals(2, pages.length);

    assertEquals(100, pages[0].id);
    assertEquals("http://test.jp", pages[0].url);
    assertEquals("test page" , pages[0].title);
    
    assertRaise("DBAccessError", function(){ DAO.insertPage({ id: 101, url: "http://test1.jp", title: "test page"}); });

}
testGetPages.description = 'test for DAO.getPages';


function testGetPageByUrl(){
    DAO.insertPage({ id: 100, url: "http://test.jp", title: "test page"});
    DAO.insertPage({ id: 101, url: "http://test1.jp", title: "test1 page"});

    var page = DAO.getPageByUrl("http://test.jp");
    assertEquals(100, page.id);
    assertEquals("http://test.jp", page.url);
    assertEquals("test page" , page.title);
}

testGetPageByUrl.description = 'test for DAO.getPageByUrl';


function testGetStickiesByPageId(){
    var sticky1 = new Sticky({ id: 1, url: "http://test1", top: 100, left: 100, width: 100, height: 100, 
			      content: "test1", color: "yellow", tag : "test" });
    DAO.insertSticky(sticky1);
    var sticky2 = new Sticky({ id: 2, url: "http://test2", top: 100, left: 100, width: 100, height: 100, 
			      content: "test2", color: "yellow", tag : "test" });
    DAO.insertSticky(sticky2);
    var sticky3 = new Sticky({ id: 3, url: "http://test3", top: 100, left: 100, width: 100, height: 100, 
			       content: "test3", color: "yellow", tag : "test" });
    DAO.insertSticky(sticky3);
    var page_id = DAO.getPageByUrl("http://test1").id;
    var stickies = DAO.getStickiesByPageId(page_id);

    assertEquals(1, stickies.length);
}
testGetStickiesByPageId.description = 'test for DAO.getStickiesByPageId';


function testRow2Obj(){
    var url = "http://test.jp";
    var obj = { id: 100, url: url, title: "test page"};
    DAO.insertPage(obj);
    var dbConn = DAO.getDBConn();
    var sql = "SELECT * FROM page WHERE url = '" + url + "'";
    var page = null;
    dump(sql + "\n");
    var statement = dbConn.createStatement(sql);
    while(statement.executeStep()){
	var _obj = DAO.row2Obj(statement.row, ["id", "url", "title"]);
	assertEquals(obj.id, _obj.id);
	assertEquals(obj.url, _obj.url);
	assertEquals(obj.title, _obj.title);
    };
    statement.finalize();
    dbConn.close();

    
}
testRow2Obj.description = 'test for DAO.row2Obj';


