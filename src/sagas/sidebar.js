import browser from 'webextension-polyfill';
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
import routerSaga       from './router';

const portName = `sidebar-${Date.now()}`;
const port = getPort(portName);

function jumpToSticky({ payload }) {
  port.postMessage({ type: 'jump-to-sticky', portName, payload });
}

function* watchJumpToSticky() {
  yield takeEvery('JUMP_TO_STICKY', jumpToSticky);
}

function importStickies({ payload }) {
  port.postMessage({ type: 'import-menu', portName, payload: [] });
}

function* watchImport() {
  yield takeEvery('IMPORT', importStickies);
}

function fetchStickies() {
  port.postMessage({ type: 'fetch-stickies', portName, payload: {} });
}

function* watchFetchStickies() {
  yield takeEvery('FETCH_STICKIES', fetchStickies);
}

function normalizeMessagePayload(payload) {
  let info = Promise.resolve({ name: 'chrome' });
  if (browser.runtime.getBrowserInfo) {
    info = browser.runtime.getBrowserInfo();
  }
  return info.then((info) => {
    switch (info.name) {
      case 'Firefox':
        return payload;
      default: {
        const { stickies, pages, tags } = payload;
        const normalize = (items) => {
          for (let i = 0; i < items.length; i += 1) {
            console.log(items[i].updated_at);
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
      case 'fetched-stickies': {
        const payload = yield normalizeMessagePayload(event.payload);
        yield put({ type: 'FETCHED_STICKIES', payload });
        break;
      }
      case 'created-sticky':
        yield put({ type: 'CREATED_STICKIES', payload: event.payload });
        break;
      case 'saved-sticky':
        yield put({ type: 'SAVED_STICKIES', payload: event.payload });
        break;
      case 'deleted-sticky':
        yield put({ type: 'DELETED_STICKIES', payload: event.payload });
        break;
      case 'cleared-stickies':
        yield put({ type: 'CLEARED_STICKIES', payload: event.payload });
        break;
      case 'imported-stickies':
        yield put({ type: 'IMPORTED_STICKIES', payload: event.payload });
        break;
      case 'error':
        alert(`${event.type}: ${event.payload.message}`);
        break;
      default:
        break;
    }
  }
}


export default function* root() {
  yield [
    fork(watchJumpToSticky),
    fork(watchImport),
    fork(watchFetchStickies),
    fork(watchPort),
    fork(routerSaga),
  ];
}
