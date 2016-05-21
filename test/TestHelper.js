const stickynotes = require('../lib/stickynotes');
module.exports = {
  setupDB: function(needMigration) {
    let c;
    return stickynotes.DBHelper.connection().then((_c) => {
      c = _c;
      return stickynotes.DBHelper.createTables(c);
    }).then(() => {
      if (needMigration) {
        return stickynotes.DBHelper.migrate(c);
      } else {
        return Promise.resolve();
      }
    }).then(() => {
      return c.close();
    });
  },
  teardownDB: function() {
    let c;
    return stickynotes.DBHelper.connection().then((_c) => {
      c = _c;
      return stickynotes.DBHelper.dropTables(c).then(() => c.close());
    });
  },
  runDBMigrationTest: function(assert, done, testFunction) {
    let c;
    return this.setupDB(false).then(() => {
      return testFunction();
    }).then(() => {
      return this.teardownDB();
    }, (e) => {
      assert.fail(e);
      return this.teardownDB();
    }).then(() => done());
  },
  runDBTest: function(assert, done, testFunction) {
    let c;
    return this.setupDB(true).then(() => {
      return testFunction();
    }).then(() => {
      return this.teardownDB();
    }, (e) => {
      assert.fail(e);
      return this.teardownDB();
    }).then(() => done());
  }
};
