"use strict";

const webext      = require('sdk/webextension');
const timers      = require('sdk/timers');
const sdkMain     = require('./index');
const config      = require('./lib/config');
const Logger      = require('./lib/Logger');
const stickynotes = require('./lib/stickynotes');
const ApiClient   = require('./lib/ApiClient');

let webExtensionPort = null;
let popupPort = null;
let sidebarPort = null;
function handleMessage() {
}

function handleSidebarMessage(msg) {
  Logger.trace(`sidebar message ${msg.type}`);
}

webext.startup().then(({ browser }) => {
  browser.runtime.onConnect.addListener((port) => {
    Logger.trace(`onConnect ${port.name}`);
    if (port.name === 'legacy-stickynotes') {
      webExtensionPort = port;
      webExtensionPort.postMessage({
        type: 'connected',
      });
      webExtensionPort.onMessage.addListener(handleMessage);
      main();
    }
    if (port.name.startsWith('sidebar')) {
      sidebarPort = port;
      sidebarPort.onMessage.addListener(handleSidebarMessage);
    }
    if (port.name === 'popup') {
      popupPort = port;
    }
    port.onDisconnect.addListener((port) => {
      Logger.trace(`onDisconnect ${port.name}`);
      if (port.name === 'legacy-stickynotes') {
        webExtensionPort.onMessage.removeListener(handleMessage);
      }
      if (port.name.startsWith('sidebar')) {
        sidebarPort.onMessage.removeListener(handleSidebarMessage);
      }
    });
  });
});

function main() {
  const lastSynced = stickynotes.lastSynced;
  Logger.setLevel(config.logLevel);
  console.log('migrate ----------------------------------------------------------------');
  sdkMain.migrate()
    .then(() => {
      console.log('migrate ----------------------------------------------------------------');
    })
    .then(() => stickynotes.Sticky.count())
    .then((count) => {
      const limit = 1000;
      const delay = limit * 30;
      let promise = Promise.resolve();
      for (let offset = 0; offset < count; offset += limit) {
        promise = promise
          .then(() => stickynotes.Sticky.fetchItems(offset, limit))
          .then((stickies) => {
            const finish = offset + limit >= count;
            webExtensionPort.postMessage({
              type:    'migrate',
              payload: {
                stickies,
                lastSynced,
                accessToken: ApiClient.getAccessToken(),
                user:        ApiClient.getUser(),
                finish,
                offset,
                count,
              },
            });
            return new Promise((resolve) => {
              timers.setTimeout(() => {
                resolve();
              }, delay);
            });
          });
      }
      return promise;
    });
}
