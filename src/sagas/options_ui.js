import browser from 'webextension-polyfill';
import logger from 'kiroku';
import csv from 'csv/lib/es5/sync';
import {
  fork,
  take,
  takeEvery,
  select,
  call,
} from 'redux-saga/effects';
import {
  getPort,
  createPortChannel,
} from '../utils/port';

import Sticky from '../models/Sticky';

const portName = `options-ui-${Date.now()}`;
const port = getPort(portName);

function downloadAsFile(fileName, content) {
  const blob = new Blob([content]);
  const blobURL = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.download = fileName;
  a.href = blobURL;
  const event = document.createEvent('MouseEvents');
  event.initEvent('click', false, true);
  a.dispatchEvent(event);
}

function formatStickies(format, stickies) {
  switch (format) {
    case 'csv': {
      const records = stickies.map(Sticky.toCSV);
      records.unshift(Sticky.props);
      return csv.stringify(records);
    }
    case 'json':
      return JSON.stringify(stickies);
    default:
      return '';
  }
}

function* watchPort() {
  const portChannel = yield call(createPortChannel, port);

  for (;;) {
    const event = yield take(portChannel);
    switch (event.type) {
      case 'imported': {
        /* eslint-disable  no-alert */
        alert(`${event.payload.count} stickies imported.`);
        break;
      }
      case 'export': {
        const { name, stickies, format } = event.payload;
        const fileName = `stickynotes_${name}.${format}`;
        downloadAsFile(fileName, formatStickies(format, stickies));
        break;
      }
      case 'error':
        logger.error(`${event.type}: ${event.payload.message}`);
        break;
      default:
        break;
    }
  }
}

function importStickies({ payload }) {
  port.postMessage({ type: 'import', portName, payload });
}

function* watchImport() {
  yield takeEvery('IMPORT', importStickies);
}

function exportStickies({ payload: format }) {
  port.postMessage({ type: 'export', portName, payload: { format } });
}

function* watchExport() {
  yield takeEvery('EXPORT', exportStickies);
}

function* watchCanMoveFocusByTab() {
  yield takeEvery('UPDATE_CAN_MOVE_FOCUS_BY_TAB', function* update() {
    const { canMoveFocusByTab } = yield select(state => state);
    yield browser.storage.local.set({ canMoveFocusByTab });
    port.postMessage({ type: 'updated-options', portName });
  });
}


export default function* root() {
  yield [
    fork(watchPort),
    fork(watchImport),
    fork(watchExport),
    fork(watchCanMoveFocusByTab),
  ];
}
