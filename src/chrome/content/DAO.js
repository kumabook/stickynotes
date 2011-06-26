/**
 * @fileoverview DAO.js.
 *
 * @author Hiroki Kumamoto
 */

/** @class */
var DAO =
    /** @lends DAO
     * @return {Object} dabase.
     * */
{
    getDBConn: function() {
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
    },
    createTables: function() {
        var dbConn = DAO.getDBConn();
        dbConn.executeSimpleSQL('CREATE TABLE IF NOT EXISTS sticky(' +
                                'id INTEGER PRIMARY KEY , page_id INTEGER ,' +
                                'left INTEGER, top INTEGER, width INTEGER, ' +
                                'height INTEGER, content TEXT, color TEXT,' +
                                'tag_id TEXT)');
        dbConn.executeSimpleSQL('CREATE TABLE IF NOT EXISTS page(' +
                                'id INTEGER PRIMARY KEY , url TEXT UNIQUE,' +
                               'title TEXT)');
    },
    dropTables: function() {
        var dbConn = DAO.getDBConn();
        dbConn.executeSimpleSQL('DROP TABLE IF EXISTS "sticky" ');
        dbConn.executeSimpleSQL('DROP TABLE IF EXISTS "page" ');
        dbConn.close();
    },
    insertSticky: function(sticky) {
        var dbConn = DAO.getDBConn();
        var sql = "insert into sticky values('" + sticky.id + "','" +
            sticky.page_id + "','" + sticky.left + "','" + sticky.top +
            "','" + sticky.width + "','" + sticky.height + "','" +
            sticky.content + "','" + sticky.color + "','" + sticky.tag + "')";
        try {
            dbConn.executeSimpleSQL(sql);
        } catch (e) {
            dump('DataBaseException: insertSticky!  ' + e);
            alert('DataBaseException: insertSticky!  ' + e);
            dbConn.close();
            throw new DBAccessError();
            return false;
        }
        dbConn.close();
        return true;
    },
    updateSticky: function(sticky) {
        var dbConn = DAO.getDBConn();
        var sql = "UPDATE sticky SET id = '" + sticky.id + "', page_id = '" +
            sticky.page_id + "', left = '" + sticky.left + "', top = '" +
            sticky.top + "', width = '" + sticky.width + "', height = '" +
            sticky.height + "', content = '" + sticky.content + "', color ='" +
            sticky.color + "', tag = '" + sticky.tag + "' WHERE id = '" +
            sticky.id + "'";
        try {
            dbConn.executeSimpleSQL(sql);
        } catch (x) {
            dump('DataBaseException: updateSticky!  ' + e);
            dbConn.close();
            throw new DBAccessError();
        }
        dbConn.close();
        return true;

        //sticky.updateStickySidebar();
    },
    deleteSticky: function(sticky) {
        var dbConn = DAO.getDBConn();
        if (DAO.getStickyById(sticky.id) != null) {
            var sql = 'DELETE from sticky where id=' + sticky.id;
            try {
                dbConn.executeSimpleSQL(sql);
            } catch (e) {
                dump('DataBaseException: deleteSticky!  ' + e);
                dbConn.close();
                throw new DBAccessError();
            }
            dbConn.close();
            return true;
        }
        else
            return false;
    },
    insertPage: function(page) {
        var dbConn = DAO.getDBConn();
        //page.page_id = Math.round(Math.random() * 10000);
        var sql = "insert into page values('" +
            page.id + "','" + page.url + "','" + page.title + "')";
        dump('new url regist   ' + sql + '\n');
        try {
            dbConn.executeSimpleSQL(sql);
        } catch (e) {
            dbConn.close();
            throw new DBAccessError();
        }
        dbConn.close();
        return true;
    },
    getPages: function() {
            var result = [];
        var dbConn = DAO.getDBConn();
        var sql = 'SELECT * FROM page ';
            dump(sql + '\n');
        var statement = dbConn.createStatement(sql);
        while (statement.executeStep()) {
            var page = {
                id: statement.row.id,
                url: statement.row.url,
                title: statement.row.title
            };
            result.push(page);
        }
        return result;
    },
    getPageByUrl: function(url) {
            var dbConn = DAO.getDBConn();
        var sql = "SELECT * FROM page WHERE url = '" + url + "'";
        var page = null;
        dump(sql + '\n');
        var statement = dbConn.createStatement(sql);
        while (statement.executeStep()) {
            page = {
                id: statement.row.id,
                url: statement.row.url,
                title: statement.row.title
            };
        }
        statement.finalize();
        dbConn.close();
        return page;
    },
    getPageById: function(id) {
        var dbConn = DAO.getDBConn();
        var sql = 'SELECT * FROM page WHERE id =' + id;
        var page = null;
        dump(sql + '\n');
        var statement = dbConn.createStatement(sql);
        while (statement.executeStep()) {
            page = {
                id: statement.row.id,
                url: statement.row.url,
                title: statement.row.title
            };
            }
        statement.finalize();
        dbConn.close();
        return page;
        },
    getStickiesByPageId: function(page_id) {
        var result = [];
        var dbConn = DAO.getDBConn();
        var sql = 'SELECT * FROM sticky WHERE page_id=' + page_id;
        dump(sql + '\n');
        var statement = dbConn.createStatement(sql);
        while (statement.executeStep()) {
            result.push(new Sticky(DAO.row2Obj(statement.row)));
        }
        statement.finalize();
        dbConn.close();
        return result;
    },
    getStickyById: function(id) {
        var result;
            var dbConn = DAO.getDBConn();
        var sql = 'SELECT * FROM sticky WHERE id = ' + id;
            dump(sql + '\n');
        var url, title;
        var statement = dbConn.createStatement(sql);
        try {
            while (statement.executeStep()) {
                result = new Sticky(DAO.row2Obj(statement.row));
            }
        } catch (e) {
            statement.finalize();
            dbConn.close();
        }
        statement.finalize();
        dbConn.close();
        return result;
    },
    getStickiesByUrl: function(url) {
        var page = DAO.getPageByUrl(url);
        if (page)
            return DAO.getStickiesByPageId(page.id);
        else
            return [];
    },
    getStickiesByTag: function() {
    },
    row2Obj: function(row, name_array) {
        if (!name_array)
            return {
                id: row.id,
                page_id: row.page_id,
                left: row.left,
                top: row.top,
                width: row.width,
                    height: row.height,
                content: row.content,
                color: row.color,
                tag: row.tag
            };
        else {
            var obj = { };
            for (var i = 0; i < name_array.length; i++) {
                obj[name_array[i]] = row[name_array[i]];
                }
            return obj;
        }
    }
};

var DBAccessError = function() {
    this.name = 'DBAccessError';
    this.message = 'Database Access Error';
};
DBAccessError.prototype = new Error();
