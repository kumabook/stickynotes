/* global browser: false */


/*
const portName = `content-script-jump-${window.location.href}`;
const port     = browser.runtime.connect({ name: portName });

port.onMessage.addListener((msg) => {
  const { type } = msg;
  switch (type) {
    case 'focus': {
      const sticky = msg.payload;
      const elem = document.getElementById(`sticky_id_${sticky.uuid}`);
      if (elem) {
        elem.focus();
      }
      break;
    }
    default:
      break;
  }
});

self.postMessage(document.location.href);
*/
