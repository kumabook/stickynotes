var stickynotes = require('./stickynotes');
stickynotes.config = {
  rootUrl: 'https://stickynotes-backend.herokuapp.com',
  clientId: "xxxxx",
  clientSecret: "xxxx",
  syncInterval: 30 * 1000,
  logLevel: 'TRACE'
};
module.exports = stickynotes.config;
