"use strict";

const webext      = require('sdk/webextension');
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
  sdkMain.migrate()
    .then(() => stickynotes.Sticky.fetchAll())
    .then(stickies => webExtensionPort.postMessage({
      type:    'migrate',
      payload: {
        stickies,
        lastSynced,
        accessToken: ApiClient.getAccessToken(),
        user:        ApiClient.getUser(),
      },
    }));
}
