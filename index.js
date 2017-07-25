const unload         = require('sdk/system/unload');
const stickynotes    = require('./lib/stickynotes');
const logger         = stickynotes.Logger;

function migrate() {
  return stickynotes.DBHelper.connection()
    .then(conn => stickynotes.DBHelper.createTables(conn)
          .then(() => stickynotes.DBHelper.migrate(conn))
          .then(() => conn.close())
          .catch((e) => {
            logger.error(`Migration error ${e}`);
            conn.close();
          }));
}


unload.when(reason => logger.trace(`unload: ${reason}`));

module.exports = {
  migrate,
};
