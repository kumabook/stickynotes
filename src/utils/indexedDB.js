/* global indexedDB: false */

//const { indexedDB } = require('sdk/indexed-db');

function open(dbName, version = 1) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, version, { storage: 'persistent' });
    request.onerror = event => reject(event);
    request.onsuccess = event => resolve(event.target.result);
  });
}

function upgrade(dbName, version = 1, callback) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, version, { storage: 'persistent' });
    request.onerror = event => reject(event);
    request.onsuccess = event => resolve(event.target.result);
    request.onupgradeneeded = (event) => {
      callback(event.target.result).then(() => {
        resolve(event.target.result);
      });
    };
  });
}

function transactionComplete(store) {
  return new Promise((resolve) => {
    store.transaction.oncomplete = resolve;
  });
}

export default {
  open,
  upgrade,
  transactionComplete,
};
