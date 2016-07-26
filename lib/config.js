var stickynotes = require('./stickynotes');
stickynotes.config = {
  rootUrl: 'https://stickynotes-backend.herokuapp.com',
  clientId: "acc5a54bd52c7eaccfc593204bceca975c9cf5316e374d75c069e5f30500296b",
  clientSecret: "6b5e972425ba244f54bf1d6aa553d856092bb76a2763c5f5ac0eb0c55761ae58",
  syncInterval: 30 * 1000,
  logLevel: 'TRACE'
};
module.exports = stickynotes.config;
