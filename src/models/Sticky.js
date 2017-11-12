/* global IDBKeyRange: false */
import uuid  from 'uuid/v4';
import Model from './Model';
import Page  from './Page';
import Tag   from './Tag';
import idb   from '../utils/indexedDB';

const Sticky = new Model('stickies');

Sticky.State = {
  Normal:    0,
  Deleted:   1,
  Minimized: 2,
};

Sticky.normalizeLegacy = function normalizeLegacy(sticky) {
  sticky.tags   = Array.from(new Set(sticky.tags.map(t => t.name)));
  sticky.url    = sticky.page_.url;
  sticky.title  = sticky.page_.title;
  delete sticky.page_;
  return Sticky.normalize(sticky);
};

Sticky.normalize = function normalize(sticky) {
  sticky.id       = sticky.uuid;
  sticky.tagNames = sticky.tags;
  sticky.tags     = [];
  if (typeof sticky.created_at === 'string') {
    sticky.created_at = new Date(sticky.created_at);
  }
  if (typeof sticky.updated_at === 'string') {
    sticky.updated_at = new Date(sticky.updated_at);
  }
  delete sticky.uuid;
  delete sticky.page;
  return sticky;
};

Sticky.createObjectStore = function createObjectStore(db) {
  const objectStore = db.createObjectStore(this.name, { keyPath: 'id' });
  objectStore.createIndex('url', 'url', { unique: false });
  objectStore.createIndex('created_at', 'created_at', { unique: false });
  objectStore.createIndex('updated_at', 'updated_at', { unique: false });
  return idb.transactionComplete(objectStore);
};


Sticky.new = (sticky, db) => {
  if (!sticky.id) {
    sticky.id = uuid();
  }
  return Page.findOrCreateBy({ url: sticky.url, title: sticky.title }, db)
    .then((page) => {
      sticky.page = page;
      return Sticky.updateTags(sticky, db);
    })
    .then(() => Sticky.create(sticky, db))
    .then(() => sticky);
};

Sticky.updateTags = function updateTags(sticky, db) {
  const removeFromTag = t => Tag.findById(t.id, db).then((tag) => {
    if (!tag) {
      return Promise.resolve();
    }
    tag.stickyIds = tag.stickyIds.filter(id => id !== sticky.id);
    return Tag.update(tag, db);
  });
  const addToTag = name => Tag.findOrCreateByName(name, db).then((t) => {
    if (!t.stickyIds.includes(sticky.id)) {
      t.stickyIds.push(sticky.id);
    }
    return Tag.update(t, db).then(() => ({ id: t.id, name: t.name }));
  });
  return Promise.all(sticky.tags.map(removeFromTag))
    .then(() => Promise.all(sticky.tagNames.map(addToTag)).then((tags) => {
      sticky.tags = tags;
    }));
};

Sticky.update = function update(sticky, db) {
  return Sticky.updateTags(sticky, db)
    .then(() => Model.prototype.update.call(this, sticky, db));
};

Sticky.findByUrl = function findByUrl(url, db) {
  const store = this.objectStore(db);
  const items = [];
  return new Promise((resolve, reject) => {
    const index   = store.index('url');
    const hasUrl  = IDBKeyRange.only(url);
    const request = index.openCursor(hasUrl);
    request.onerror   = reject;
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        items.push(cursor.value);
        cursor.continue();
      } else {
        resolve(items);
      }
    };
  });
};

Sticky.findBySince = function findBySince(date, db) {
  console.log('-------');
  console.log(date);
  const store = this.objectStore(db);
  const items = [];
  return new Promise((resolve, reject) => {
    const index       = store.index('updated_at');
    const since       = IDBKeyRange.lowerBound(date);
    const request     = index.openCursor(since);
    request.onerror   = reject;
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        items.push(cursor.value);
        cursor.continue();
      } else {
        console.log(items);
        resolve(items);
      }
    };
  });
};

Sticky.isDeleted = sticky => sticky.state === Sticky.State.Deleted;

export default Sticky;
