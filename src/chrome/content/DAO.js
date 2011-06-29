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
                                'height INTEGER, content TEXT, color TEXT)');
        dbConn.executeSimpleSQL('CREATE TABLE IF NOT EXISTS page(' +
                                'id INTEGER PRIMARY KEY , url TEXT UNIQUE,' +
                               'title TEXT)');
        dbConn.executeSimpleSQL('CREATE TABLE IF NOT EXISTS tag(' +
                                'id INTEGER PRIMARY KEY , name TEXT UNIQUE)');
        dbConn.executeSimpleSQL('CREATE TABLE IF NOT EXISTS sticky_tag(' +
                                'id INTEGER PRIMARY KEY ,' +
                                'sticky_id INTEGER, tag_id INTEGER)');

    },
    dropTables: function() {
        var dbConn = DAO.getDBConn();
        dbConn.executeSimpleSQL('DROP TABLE IF EXISTS "sticky" ');
        dbConn.executeSimpleSQL('DROP TABLE IF EXISTS "page" ');
        dbConn.executeSimpleSQL('DROP TABLE IF EXISTS "tag" ');
        dbConn.executeSimpleSQL('DROP TABLE IF EXISTS "sticky_tag" ');
        dbConn.close();
    },
    insertSticky: function(sticky) {
        var dbConn = DAO.getDBConn();
        var sql = "insert into sticky values('" + sticky.id + "','" +
            sticky.page_id + "','" + sticky.left + "','" + sticky.top +
            "','" + sticky.width + "','" + sticky.height + "','" +
            sticky.content + "','" + sticky.color + "')";
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
            sticky.color + "' WHERE id = '" +
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
    getStickies: function() {
        var result = [];
        var sticky, tag;
        var dbConn = DAO.getDBConn();
        var sql = 'SELECT * FROM sticky';
        dump(sql + '\n');
        var statement = dbConn.createStatement(sql);
        while (statement.executeStep()) {
            sticky = new Sticky(DAO.row2Obj(statement.row));
            tag = DAO.getTagsBySticky(sticky);
            sticky.tag = tag;
            result.push(sticky);
        }
        statement.finalize();
        dbConn.close();
        return result;
    },
    getStickiesByPageId: function(page_id) {
        var sticky, tag;
        var result = [];
        var dbConn = DAO.getDBConn();
        var sql = 'SELECT * FROM sticky WHERE page_id=' + page_id;
        dump(sql + '\n');
        var statement = dbConn.createStatement(sql);
        while (statement.executeStep()) {
            sticky = new Sticky(DAO.row2Obj(statement.row));
            tag = DAO.getTagsBySticky(sticky);
            sticky.tag = tag;
            result.push(sticky);
        }
        statement.finalize();
        dbConn.close();
        return result;
    },
    getStickyById: function(id) {
        var sticky, tag;
        var dbConn = DAO.getDBConn();
        var sql = 'SELECT * FROM sticky WHERE id = ' + id;
            dump(sql + '\n');
        var statement = dbConn.createStatement(sql);
        try {
            while (statement.executeStep()) {
                sticky = new Sticky(DAO.row2Obj(statement.row));
                tag = DAO.getTagsBySticky(sticky);
                sticky.tag = tag;
            }
        } catch (e) {
            statement.finalize();
            dbConn.close();
        }
        statement.finalize();
        dbConn.close();
        return sticky;
    },
    getStickiesByUrl: function(url) {
        var page = DAO.getPageByUrl(url);
        if (page)
            return DAO.getStickiesByPageId(page.id);
        else
            return [];
    },
    insertTag: function(tag) {
        var dbConn = DAO.getDBConn();
        var sql = 'insert into tag values(' + tag.id + ",'" + tag.name + "')";
        try {
            dbConn.executeSimpleSQL(sql);
        } catch (e) {
            dump('DataBaseException: insertTag!  ' + e);
            alert('DataBaseException: insertTag!  ' + e);
            dbConn.close();
            return false;
        }
        dbConn.close();
        return true;
    },
    deleteTag: function(tag){
        var dbConn = DAO.getDBConn();
        if (DAO.getStickyById(sticky.id) != null) {
            var sql = 'DELETE from tag where id=' + tag.id;
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
    },
    getTagByName: function(name){
        var dbConn = DAO.getDBConn();
        var sql = "SELECT * FROM tag WHERE name ='" + name + "'";
        var tag = null;
        dump(sql + '\n');
        var statement = dbConn.createStatement(sql);
        while (statement.executeStep()) {
             tag= {
                id: statement.row.id,
                 name: statement.row.name
            };
        }
        statement.finalize();
        dbConn.close();
        return tag;
    },
    getRelationStickyAndTag: function(){
         var dbConn = DAO.getDBConn();
        var sql = "SELECT * FROM sticky_tag";
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
    },
    insertRelationStickyAndTag: function(sticky, tag, relation_id) {
        if (!relation_id)
             relation_id = Math.round(Math.random() * 10000);
        var dbConn = DAO.getDBConn();
        var sql = 'insert into sticky_tag values(' + relation_id + ',' +
            sticky.id + ',' + tag.id + ')';
        try {
            dbConn.executeSimpleSQL(sql);
        } catch (e) {
            dump('DataBaseException: insertRelationStickyAndTag!  ' + e);
            alert('DataBaseException: insertRelationStickyAndTag!  ' + e);
            dbConn.close();
            throw new DBAccessError();
            return false;
        }
        dbConn.close();
        return true;
    },
    deleteRelationStickyAndTag: function(sticky) {
        var dbConn = DAO.getDBConn();
        if (DAO.getStickyById(sticky.id) != null) {
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
    },
    getTags: function() {
        var result = [];
        var dbConn = DAO.getDBConn();
        var sql = 'SELECT * FROM tag ';
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
        return result;
    },
    getStickiesByTag: function(tag) {
        var result = [];
        var dbConn = DAO.getDBConn();
        var sql = 'SELECT * FROM sticky ' +
            'LEFT OUTER JOIN sticky_tag ON (sticky.id=sticky_tag.sticky_id) ' +
            'LEFT OUTER JOIN tag ON (sticky_tag.tag_id=tag.id) ' +
            "WHERE tag.name='" + tag + "'";
            dump(sql + '\n');
        var statement = dbConn.createStatement(sql);
        try {
            while (statement.executeStep()) {
                var sticky = new Sticky(DAO.row2Obj(statement.row));
                result.push(sticky);
            }
        } catch (e) {
            alert(e);
            statement.finalize();
            dbConn.close();
        }
        statement.finalize();
        dbConn.close();

        return result;
    },
    getTagById: function(id) {
        var tag;
        var dbConn = DAO.getDBConn();
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
    },
    getStickiesByUrl: function(url) {
        var page = DAO.getPageByUrl(url);
        if (page)
            return DAO.getStickiesByPageId(page.id);
        else
            return [];
    },
    getTagsBySticky: function(sticky) {
/*        var tags = [];
        var relations = DAO.getRelationStickyAndTag(sticky);
        for(var i = 0; i < relations.length; i++){
            if(sticky.id == relations[i].sticky_id){
                tags.push(DAO.getTagById(relations[i].tag_id).name);
            }
        }
        return tags;*/
        var result = [];
        var dbConn = DAO.getDBConn();
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
                color: row.color
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
