import uuid from 'uuid/v4';
import Model from './Model';
import idb from '../utils/indexedDB';

const Page = new Model('pages');

Page.createObjectStore = function createObjectStore(db) {
  const objectStore = db.createObjectStore(this.name, { keyPath: 'id' });
  objectStore.createIndex('url', 'url', { unique: true });
  idb.transactionComplete(objectStore);
};

Page.findByUrl = function findByUrl(url, db) {
  const objectStore = this.objectStore(db);
  const index = objectStore.index('url');
  return new Promise((resolve, reject) => {
    const request     = index.get(url);
    request.onerror   = reject;
    request.onsuccess = () => resolve(request.result);
  });
};

Page.findOrCreateBy = function findOrCreateBy(query, db) {
  return Page.findByUrl(query.url, db).then((page) => {
    if (page) {
      return page;
    }
    return Page.create({
      id:    uuid(),
      url:   query.url,
      title: query.title,
    }, db);
  });
};

export default Page;
