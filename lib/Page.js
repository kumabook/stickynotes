if (!stickynotes) {
  var stickynotes = require('./stickynotes');
}
stickynotes.Page = function(param) {
  this.id = param.id;
  this.url = param.url;
  this.title = param.title;
};

stickynotes.Page.defaultTitle = function() {
  return 'no title';
};

stickynotes.Page.keys = ['id', 'url', 'title'];

stickynotes.Page.create = function(param) {
  const sql    = 'INSERT INTO page VALUES(:id,:url,:title)';
  const params = { id: param.id, url: param.url, title: param.title };
  return stickynotes.DBHelper.execute(sql, params)
    .then(() => new stickynotes.Page(param));
};

stickynotes.Page.findOrCreate = function(url, title) {
  return stickynotes.Page.fetchByUrl(url).then((page) => {
    if (!page) {
      const page_id = Math.round(Math.random() * 10000);
      if (!title) {
        title = stickynotes.Page.defaultTitle();
      }
      return stickynotes.Page.create({
        id: page_id,
        url: url,
        title: title
      });
    }
    return page;
  });
};

stickynotes.Page.fetch = function(sql, params) {
  return stickynotes.DBHelper.fetch(stickynotes.Page, sql, params);
};

stickynotes.Page.fetchAll = function() {
  const sql = 'SELECT * FROM page';
  return this.fetch(sql).then((l) => l.sort((a, b) => a.title > b.title));
};

stickynotes.Page.fetchById = function(id) {
  const sql    = 'SELECT * FROM page WHERE id=:id';
  const params = { id: id };
  return this.fetch(sql, params).then((l) => l.find((p) => p.id === id));
};

stickynotes.Page.fetchByUrl = function(url) {
  const sql    = 'SELECT * FROM page WHERE url=:url';
  const params = { url: url };
  return this.fetch(sql, params).then((l) => l.find((p) => p.url == url));
};

module.exports = stickynotes.Page;
