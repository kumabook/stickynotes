import browser from 'webextension-polyfill';
import logger from 'kiroku';
import {
  fork,
  take,
  takeEvery,
  put,
  call,
} from 'redux-saga/effects';
import {
  getPort,
  createPortChannel,
} from '../utils/port';
const portName = `options-ui-${Date.now()}`;
const port = getPort(portName);

function normalizeMessagePayload(payload) {
  let browserInfo = Promise.resolve({ name: 'chrome' });
  if (browser.runtime.getBrowserInfo) {
    browserInfo = browser.runtime.getBrowserInfo();
  }
  return browserInfo.then((info) => {
    /* eslint-disable  no-param-reassign */
    switch (info.name) {
      case 'Firefox':
        return payload;
      default: {
        const { stickies, pages, tags } = payload;
        const normalize = (items) => {
          for (let i = 0; i < items.length; i += 1) {
            items[i].created_at = new Date(items[i].created_at);
            items[i].updated_at = new Date(items[i].updated_at);
          }
        };
        normalize(stickies);
        normalize(pages);
        normalize(tags);
        return payload;
      }
    }
  });
}

function* watchPort() {
  const portChannel = yield call(createPortChannel, port);

  for (;;) {
    const event = yield take(portChannel);
    switch (event.type) {
      case 'imported-stickies':
        yield put({ type: 'IMPORTED_STICKIES', payload: event.payload });
        break;
      case 'error':
        logger.error(`${event.type}: ${event.payload.message}`);
        break;
      default:
        break;
    }
  }
}

function importStickies() {
  port.postMessage({ type: 'import', portName, payload: [] });
}

function* watchImport() {
  yield takeEvery('IMPORT', importStickies);
}

export default function* root() {
  yield [
    fork(watchPort),
    fork(watchImport),
  ];
}
