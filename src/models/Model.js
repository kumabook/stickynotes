import idb from '../utils/indexedDB';

export default function Model(name) {
  this.name = name;
}

Model.prototype.createObjectStore = function createObjectStore(db) {
  const objectStore = db.createObjectStore(this.name, { keyPath: 'id' });
  objectStore.createIndex('created_at', 'created_at', { unique: false });
  objectStore.createIndex('updated_at', 'updated_at', { unique: false });
  return idb.transactionComplete(objectStore);
};

Model.prototype.objectStore = function objectStore(db) {
  return db.transaction(this.name, 'readwrite').objectStore(this.name);
};

Model.prototype.findAll = function findAll(db) {
  const store = this.objectStore(db);
  const items = [];
  return new Promise((resolve) => {
    const c = store.openCursor();
    c.onsuccess = (event) => {
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

Model.prototype.findById = function findById(id, db) {
  const store = this.objectStore(db);
  return new Promise((resolve, reject) => {
    const request     = store.get(id);
    request.onerror   = reject;
    request.onsuccess = () => resolve(request.result);
  });
};

Model.prototype.create = function create(data, db) {
  const store = this.objectStore(db);
  if (!data.created_at) {
    data.created_at = new Date();
  }
  if (!data.updated_at) {
    data.updated_at = new Date();
  }
  return new Promise((resolve, reject) => {
    const request = store.add(data);
    request.onerror = reject;
    request.onsuccess = resolve;
  }).then(() => data);
};

Model.prototype.update = function update(data, db) {
  if (!data.updated_at) {
    data.updated_at = new Date();
  }
  const store = this.objectStore(db);
  return new Promise((resolve, reject) => {
    const request = store.put(data);
    request.onerror = reject;
    request.onsuccess = resolve;
  }).then(() => data);
};

Model.prototype.destroy = function destroy(id, db) {
  const store = this.objectStore(db);
  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onerror = reject;
    request.onsuccess = () => {
      resolve(request.result);
    };
  });
};
