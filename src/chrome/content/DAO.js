/**
 * @fileoverview DAO.js.
 *
 * @author Hiroki Kumamoto
 */

/** @constructor My namespace's DAO */
stickynotes.DAO = {};
/**
 * getDBConn.
 * @return {connection} Database Connection.
 */
stickynotes.DAO.getDBConn = function() {
    var file = Components.classes['@mozilla.org/file/directory_service;1']
        .getService(Components.interfaces.nsIProperties)
        .get('ProfD', Components.interfaces.nsIFile);
    file.append('stickynotes.sqlite');
    var storageService =
            Components.classes['@mozilla.org/storage/service;1']
        .getService(Components.interfaces.mozIStorageService);
    // Will also create the file if if does not exist
    var dbConn = storageService.openDatabase(file);
    return dbConn;
};
/**
 * table作成
 */
stickynotes.DAO.createTables = function() {
    var dbConn = stickynotes.DAO.getDBConn();
    dbConn.executeSimpleSQL('CREATE TABLE IF NOT EXISTS sticky(' +
                            'id INTEGER PRIMARY KEY , page_id INTEGER ,' +
                            'left INTEGER, top INTEGER, width INTEGER, ' +
                            'height INTEGER, content TEXT, color TEXT)');
    dbConn.executeSimpleSQL('CREATE TABLE IF NOT EXISTS page(' +
                            'id INTEGER PRIMARY KEY , url TEXT UNIQUE,' +
                            'title TEXT)');
    dbConn.executeSimpleSQL('CREATE TABLE IF NOT EXISTS tag(' +
                            'id INTEGER PRIMARY KEY , name TEXT UNIQUE)');
    dbConn.executeSimpleSQL('CREATE TABLE IF NOT EXISTS sticky_tag(' +
                            'id INTEGER PRIMARY KEY ,' +
                            'sticky_id INTEGER, tag_id INTEGER)');
};
/**
 * table削除
 */
stickynotes.DAO.dropTables = function() {
    var dbConn = stickynotes.DAO.getDBConn();
    dbConn.executeSimpleSQL('DROP TABLE IF EXISTS "sticky" ');
    dbConn.executeSimpleSQL('DROP TABLE IF EXISTS "page" ');
    dbConn.executeSimpleSQL('DROP TABLE IF EXISTS "tag" ');
    dbConn.executeSimpleSQL('DROP TABLE IF EXISTS "sticky_tag" ');
    dbConn.close();
};
/**
   @param {stickynotes.Sticky} sticky DBに保存するstickyオブジェクト.
   @return {Boolean} 成功したかどうか.
*/
stickynotes.DAO.insertSticky = function(sticky) {
    var dbConn = stickynotes.DAO.getDBConn();
    var statement = dbConn.createStatement(
        'insert into sticky values(:id,:page_id,:left,:top,:width,:height,' +
            ':content,:color)');
    statement.params.id = sticky.id;
    statement.params.page_id = sticky.page_id;
    statement.params.left = sticky.left;
    statement.params.top = sticky.top;
    statement.params.width = sticky.width;
    statement.params.height = sticky.height;
    statement.params.content = sticky.content;
    statement.params.color = sticky.color;
    try {
        statement.execute();
        dbConn.asyncClose();
    } catch (e) {
        alert('DataBaseException: insertSticky!  ' + e);
        dbConn.asyncClose();
        throw new DBAccessError();
    }
    return true;
};
/**
   @param {stickynotes.Sticky} sticky stickyオブジェクト.
   @return {Boolean} 成功したかどうか.
*/
stickynotes.DAO.updateSticky = function(sticky) {
    var dbConn = stickynotes.DAO.getDBConn();
    var statement = dbConn.createStatement(
        'UPDATE sticky SET left=:left,top=:top,width=:width,' +
            'height=:height,content=:content,color=:color WHERE id=:id');
    statement.params.left = sticky.left;
    statement.params.top = sticky.top;
    statement.params.width = sticky.width;
    statement.params.height = sticky.height;
    statement.params.content = sticky.content;
    statement.params.color = sticky.color;
    statement.params.id = sticky.id;
    try {
        statement.execute();
    } catch (e) {
        dump('DataBaseException: updateSticky!  ' + e);
        dbConn.asyncClose();
        throw new DBAccessError();
    } finally {
        dbConn.asyncClose();
    }
    return true;
    //sticky.updateStickySidebar();
};
/**
   @param {stickynotes.Sticky} sticky stickyオブジェクト.
   @return {Boolean} 成功したかどうか.
*/
stickynotes.DAO.deleteSticky = function(sticky) {
    var dbConn = stickynotes.DAO.getDBConn();
    var statement = dbConn.createStatement('DELETE FROM sticky WHERE id=:id');
    statement.params.id = sticky.id;
    if (stickynotes.DAO.getStickyById(sticky.id) != null) {
        try {
            statement.execute();
        } catch (e) {
            dump('DataBaseException: deleteSticky!  ' + e);
            dbConn.close();
            throw new DBAccessError();
        } finally {
            dbConn.asyncClose();
        }
        return true;
    }
    else
        return false;
};
/**
   @param {Object} page pageオブジェクト.
   @return {Boolean} 成功したかどうか.
*/
stickynotes.DAO.insertPage = function(page) {
    var dbConn = stickynotes.DAO.getDBConn();
    var statement = dbConn
        .createStatement('INSERT INTO page VALUES(:id,:url,:title)');
    statement.params.id = page.id;
    statement.params.url = page.url;
    statement.params.title = page.title;
    try {
        statement.execute();
        dbConn.asyncClose();
    } catch (e) {
        dbConn.asyncClose();
        throw new DBAccessError();
    }
    return true;
};
/**
   @return {Object} pages.
 */
stickynotes.DAO.getPages = function() {
    var result = [];
    var dbConn = stickynotes.DAO.getDBConn();
    var sql = 'SELECT * FROM page ';
    dump(sql + '\n');
    var statement = dbConn.createStatement(sql);
    try {
        while (statement.executeStep()) {
            var page = {
                id: statement.row.id,
                url: statement.row.url,
                title: statement.row.title
            };
            result.push(page);
        }
    } catch (e) {
        dbConn.asyncClose();
        throw new DBAccessError();
    }
    return result;
};
/**
   @param {String} url url.
   @return {Object} pages.
*/
stickynotes.DAO.getPageByUrl = function(url) {
    var dbConn = stickynotes.DAO.getDBConn();
    var statement = dbConn.createStatement('SELECT * FROM page WHERE url=:url');
    statement.params.url = url;
    var page = null;
    try {
        while (statement.executeStep()) {
            page = {
                id: statement.row.id,
                url: statement.row.url,
                title: statement.row.title
            };
        }
    } catch (e) {
        dbConn.asyncClose();
        throw new DBAccessError();
    }
    statement.finalize();
    dbConn.asyncClose();
    return page;
};
/**
   @param {String} id id.
   @return {Object} page.
*/
stickynotes.DAO.getPageById = function(id) {
    var dbConn = stickynotes.DAO.getDBConn();
    var statement = dbConn.createStatement('SELECT * FROM page WHERE id=:id');
    statement.params.id = id;
    var page = null;
    try {
        while (statement.executeStep()) {
            page = {
                id: statement.row.id,
                url: statement.row.url,
                title: statement.row.title
            };
        }
    } catch (e) {
        dbConn.asyncClose();
        throw new DBAccessError();
    }
    statement.finalize();
    dbConn.asyncClose();
    return page;
};
stickynotes.DAO.getStickies = function(key) {
    var result = [];
    var sticky, tag;
    var dbConn = stickynotes.DAO.getDBConn();
    var sql = 'SELECT * FROM sticky';
    var statement = dbConn.createStatement(sql);
    try {
        while (statement.executeStep()) {
            sticky = new stickynotes.
                Sticky(stickynotes.DAO.row2Obj(statement.row));
            tag = stickynotes.DAO.getTagsBySticky(sticky);
            sticky.tag = tag;
            if (key == null ||
                sticky.content.indexOf(key) != -1 ||
                sticky.tag.indexOf(key) != -1)
                result.push(sticky);
        }
    } catch (e) {
        dbConn.asyncClose();
        throw new DBAccessError();
    }
    statement.finalize();
    dbConn.asyncClose();
    return result;
};
/**
   @param {String} page_id page id.
   @param {String} key 検索ワード.
   @return {Array<stickynotes.Sticky>} stickies.
 */
stickynotes.DAO.getStickiesByPageId = function(page_id, key) {
    var sticky, tag;
    var result = [];
    var dbConn = stickynotes.DAO.getDBConn();
    var sql = 'SELECT * FROM sticky WHERE page_id=' + page_id;
    var statement = dbConn.createStatement(sql);
    try {
        while (statement.executeStep()) {
            sticky = new stickynotes.
                Sticky(stickynotes.DAO.row2Obj(statement.row));
            tag = stickynotes.DAO.getTagsBySticky(sticky);
            sticky.tag = tag;
            if (key == null ||
                sticky.content.indexOf(key) != -1 ||
                sticky.tag.indexOf(key) != -1)
                result.push(sticky);
        }
    } catch (e) {
        dbConn.asyncClose();
        throw new DBAccessError();
    }
    statement.finalize();
    dbConn.asyncClose();
    return result;
};
/**
   @param {String} id id.
   @return {stickynotes.Sticky} sticky.
 */
stickynotes.DAO.getStickyById = function(id) {
    var sticky, tag;
    var dbConn = stickynotes.DAO.getDBConn();
    var sql = 'SELECT * FROM sticky WHERE id = ' + id;
    dump(sql + '\n');
    var statement = dbConn.createStatement(sql);
    try {
        while (statement.executeStep()) {
            sticky = new stickynotes.Sticky(
                stickynotes.DAO.row2Obj(statement.row));
            tag = stickynotes.DAO.getTagsBySticky(sticky);
            sticky.tag = tag;
        }
    } catch (e) {
        statement.finalize();
        dbConn.close();
    }
    statement.finalize();
    dbConn.close();
    return sticky;
};
/**
   @param {String} url url.
   @return {Array<stickynotes.Sticky>} stickies.
 */
stickynotes.DAO.getStickiesByUrl = function(url) {
    var page = stickynotes.DAO.getPageByUrl(url);
    if (page)
        return stickynotes.DAO.getStickiesByPageId(page.id);
    else
        return [];
};
/**
   @param {String} tag tag.
   @return {Boolean} result.
 */
stickynotes.DAO.insertTag = function(tag) {
    tag.name = tag.name.replace(/^[\s　]+|[\s　]+$/g, '');//tag.name.trim();
    var dbConn = stickynotes.DAO.getDBConn();
    var statement =
        dbConn.createStatement('INSERT INTO tag VALUES(:id, :name)');
    statement.params.id = tag.id;
    statement.params.name = tag.name;
    try {
        statement.execute();
    } catch (e) {
        alert('DataBaseException: insertTag!'+tag.name + e);
        dbConn.asyncClose();
        return false;
    }
    dbConn.asyncClose();
    return true;
};
/**
   @param {String} tag tag.
   @return {Boolean} result.
 */
stickynotes.DAO.deleteTag = function(tag) {
    var dbConn = stickynotes.DAO.getDBConn();
    if (stickynotes.DAO.getStickyById(sticky.id) != null) {
        var sql = 'DELETE from tag where id=' + tag.id;
        try {
            dbConn.executeSimpleSQL(sql);
        } catch (e) {
            dbConn.asyncClose();
            throw new DBAccessError();
        }
        dbConn.asyncClose();
        return true;
    }
    else
        return false;
};
/**
   @param {String} name tag name.
   @return {String} tag.
 */
stickynotes.DAO.getTagByName = function(name) {
    name = name.replace(/^[\s　]+|[\s　]+$/g, '');
    var dbConn = stickynotes.DAO.getDBConn();
    var statement = dbConn.createStatement(
        'SELECT * FROM tag WHERE name=:name');
    statement.params.name = name;
    var tag = null;
    try {
        while (statement.executeStep()) {
            tag = {
                id: statement.row.id,
                name: statement.row.name
            };
        }
    } catch (e) {
        dbConn.asyncClose();
        throw new DBAccessError();
    }
    statement.finalize();
    dbConn.asyncClose();
    return tag;
};
/**
   @return {Object} relations.
 */
stickynotes.DAO.getRelationStickyAndTag = function() {
    var dbConn = stickynotes.DAO.getDBConn();
    var sql = 'SELECT * FROM sticky_tag';
    var relations = [];
    dump(sql + '\n');
    var statement = dbConn.createStatement(sql);
    while (statement.executeStep()) {
        relations.push({
            id: statement.row.id,
            sticky_id: statement.row.sticky_id,
            tag_id: statement.row.tag_id
        });
    }
    statement.finalize();
    dbConn.close();
    return relations;
};
/**
   @param {stickynotes.Sticky} sticky sticky.
   @param {Object} tag tag.
   @param {Int} relation_id relation id.
   @return {Boolean} result.
 */
stickynotes.DAO.insertRelationStickyAndTag =
    function(sticky, tag, relation_id) {
        if (!relation_id)
            relation_id = Math.round(Math.random() * 10000);
            var dbConn = stickynotes.DAO.getDBConn();
            var statement = dbConn.createStatement(
                'INSERT INTO sticky_tag VALUES(:r_id,:s_id,:t_id)');
        statement.params.r_id = relation_id;
        statement.params.s_id = sticky.id;
        statement.params.t_id = tag.id;
        try {
            statement.execute();
    } catch (e) {
        dump('DataBaseException: insertRelationStickyAndTag!  ' + e);
        alert('DataBaseException: insertRelationStickyAndTag!  ' + e);
        dbConn.asyncClose();
        throw new DBAccessError();
        return false;
    }
    dbConn.asyncClose();
    return true;
};
/**
 * @param {stickynotes.Sticky} sticky sticky.
 * @return {Boolean} result.
 */
stickynotes.DAO.deleteRelationStickyAndTag = function(sticky) {
    var dbConn = stickynotes.DAO.getDBConn();
    if (stickynotes.DAO.getStickyById(sticky.id) != null) {
        var sql = 'DELETE from sticky_tag  where sticky_id=' + sticky.id;
        try {
            dbConn.executeSimpleSQL(sql);
        } catch (e) {
            dump('DataBaseException: deleteTag!  ' + e);
            dbConn.close();
            throw new DBAccessError();
        }
        dbConn.close();
        return true;
    }
    else
        return false;
};
/**
 * @return {Array<Object>} tags.
 */
stickynotes.DAO.getTags = function() {
    var result = [];
    var dbConn = stickynotes.DAO.getDBConn();
    var sql = 'SELECT * FROM tag ';
    try {
        var statement = dbConn.createStatement(sql);
        while (statement.executeStep()) {
            var tag = {
                id: statement.row.id,
                name: statement.row.name
            };
            result.push(tag);
        }
    } catch (e) {
        alert(e);
        statement.finalize();
        dbConn.asyncClose();
    }
    return result;
};
/**
 * @param {String} tag tag.
 * @param {String} key key.
 * @return {Array<Object>} tags.
 */
stickynotes.DAO.getStickiesByTag = function(tag, key) {
    var result = [];
    var dbConn = stickynotes.DAO.getDBConn();
    var sql = 'SELECT * FROM sticky ' +
        'LEFT OUTER JOIN sticky_tag ON (sticky.id=sticky_tag.sticky_id) ' +
        'LEFT OUTER JOIN tag ON (sticky_tag.tag_id=tag.id) ' +
        "WHERE tag.id='" + tag.id + "'";
    dump(sql + '\n');
    var statement = dbConn.createStatement(sql);
    try {
        while (statement.executeStep()) {
            var sticky = new stickynotes
                .Sticky(stickynotes.DAO.row2Obj(statement.row));
            result.push(sticky);
        }
    } catch (e) {
        alert(e);
        statement.finalize();
        dbConn.asyncClose();
    }
    statement.finalize();
    dbConn.asyncClose();
    return result;
};
/**
 * @param {String} id id.
 * @return {Object} tag.
 */
stickynotes.DAO.getTagById = function(id) {
    var tag;
    var dbConn = stickynotes.DAO.getDBConn();
    var sql = 'SELECT * FROM tag WHERE id=' + id;
    dump(sql + '\n');
    var statement = dbConn.createStatement(sql);
    try {
        while (statement.executeStep()) {
            tag = { id: statement.row.id, name: statement.row.name};
        }
    } catch (e) {
        statement.finalize();
        dbConn.close();
    }
    statement.finalize();
    dbConn.close();
    return tag;
};
/**
 * @param {stickynotes.Sticky} sticky sticky.
 * @return {Array<Object>} tags.
 */
stickynotes.DAO.getTagsBySticky = function(sticky) {
    var result = [];
    var dbConn = stickynotes.DAO.getDBConn();
    var sql = 'SELECT * FROM tag, sticky, sticky_tag WHERE ' +
        'tag.id=sticky_tag.tag_id AND sticky.id=sticky_tag.sticky_id' +
        ' AND sticky.id=' + sticky.id;
    dump(sql + '\n');
    try {
        var statement = dbConn.createStatement(sql);
        while (statement.executeStep()) {
            var tag = {
                id: statement.row.id,
                name: statement.row.name
            };
            result.push(tag.name);
        }
    } catch (e) {
        alert(e);
        statement.finalize();
        dbConn.close();
    }
    statement.finalize();
    dbConn.close();
    return result;
};
/**
 * @param {Object} row row.
  * @param {Array<String>} name_array keyの配列.
 * @return {Object} obj.
 */
stickynotes.DAO.row2Obj = function(row, name_array) {
    if (!name_array)
        return {
            id: row.id,
            page_id: row.page_id,
            left: row.left,
            top: row.top,
            width: row.width,
            height: row.height,
            content: row.content,
            color: row.color
        };
    else {
        var obj = { };
        for (var i = 0; i < name_array.length; i++) {
            obj[name_array[i]] = row[name_array[i]];
        }
        return obj;
    }
};

var DBAccessError = function() {
    this.name = 'DBAccessError';
    this.message = 'Database Access Error';
};
DBAccessError.prototype = new Error();
