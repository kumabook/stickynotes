import logger from 'kiroku';
import {
  fork,
  take,
  takeEvery,
  call,
} from 'redux-saga/effects';
import {
  getPort,
  createPortChannel,
} from '../utils/port';

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
        const { name, stickies } = event.payload;
        downloadAsFile(`stickynotes_${name}.json`, JSON.stringify(stickies));
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

function exportStickies() {
  port.postMessage({ type: 'export', portName, payload: [] });
}

function* watchExport() {
  yield takeEvery('EXPORT', exportStickies);
}

export default function* root() {
  yield [
    fork(watchPort),
    fork(watchImport),
    fork(watchExport),
  ];
}
