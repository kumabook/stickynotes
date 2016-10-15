var stickynotes = require('./stickynotes');
stickynotes.config = {
  rootUrl: 'https://stickynotes-backend.herokuapp.com',
  clientId: "xxxxx",
  clientSecret: "xxxx",
  syncInterval: 10 * 1000,
  logLevel: 'FATAL'
};
module.exports = stickynotes.config;
