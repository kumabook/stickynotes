const stickynotes = require('../lib/stickynotes');
module.exports = {
  setupDB: function() {
    let c;
    return stickynotes.DBHelper.connection().then((_c) => {
      c = _c;
      return stickynotes.DBHelper.createTables(c);
    }).then(() => {
      return c;
    });
  },
  teardownDB: function(c) {
    return stickynotes.DBHelper.dropTables(c).then(() => c.close());
  },
  runDBTest: function(assert, testFunction) {
    let c;
    return this.setupDB().then((_c) => {
      c = _c;
      return testFunction(c);
    }).then(() => this.teardownDB(c), (e) => {
      this.teardownDB(c);
      assert.fail(e);
    });
  }
};
