import uuid  from 'uuid/v4';
import Model from './Model';
import idb from '../utils/indexedDB';

const Tag = new Model('tags');

Tag.createObjectStore = function createObjectStore(db) {
  const objectStore = db.createObjectStore(this.name, { keyPath: 'id' });
  objectStore.createIndex('name', 'name', { unique: true });
  return idb.transactionComplete(objectStore);
};

Tag.findByName = function findByName(name, db) {
  const objectStore = this.objectStore(db);
  const index = objectStore.index('name');
  return new Promise((resolve, reject) => {
    const request     = index.get(name);
    request.onerror   = reject;
    request.onsuccess = () => resolve(request.result);
  });
};

Tag.findOrCreateByName = function findOrCreateByName(name, db) {
  return Tag.findByName(name, db).then((tag) => {
    if (tag) {
      return tag;
    }
    const id        = uuid();
    const stickyIds = [];
    const item      = { id, name, stickyIds };
    return Tag.create(item, db).then(() => item);
  });
};


export default Tag;
