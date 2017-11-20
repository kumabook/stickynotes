/* global browser: false */
import {
  fork,
  takeEvery,
  call,
  take,
  put,
} from 'redux-saga/effects';
import createHistory from 'history/createHashHistory';
import {
  getPort,
  createPortChannel,
} from '../utils/port';

const history = createHistory();

const portName = 'popup';
const port = getPort(portName);

function menu({ payload }) {
  const name = payload.name;
  port.postMessage({ type: `${name}-menu`, portName, payload });
}

function* watchMenu() {
  yield takeEvery('MENU', menu);
}

function importStickies({ payload }) {
  port.postMessage({ type: 'import-menu', portName, payload: [] });
}

function* watchImport() {
  yield takeEvery('IMPORT', importStickies);
}

function login({ payload }) {
  port.postMessage({ type: 'login', portName, payload });
}

function* watchLogin() {
  yield takeEvery('LOGIN', login);
}

function signup({ payload }) {
  port.postMessage({ type: 'signup', portName, payload });
}

function* watchSignUp() {
  yield takeEvery('SIGNUP', signup);
}

function resetPassword() {
  port.postMessage({ type: 'reset-password', portName });
}

function* watchResetPassword() {
  yield takeEvery('RESET_PASSWORD', resetPassword);
}

function* watchPort() {
  const portChannel = yield call(createPortChannel, port);

  for (;;) {
    const event = yield take(portChannel);
    switch (event.type) {
      case 'logged-in':
        yield put({ type: 'LOGGED_IN', payload: event.payload });
        history.replace('/');
        break;
      case 'logged-out':
        yield put({ type: 'LOGGED_OUT' });
        break;
      case 'failed-to-login':
        yield put({ type: 'FAILED_TO_LOGIN', payload: event.payload });
        break;
      case 'signed-up':
        yield put({ type: 'SIGNED_UP', payload: event.payload });
        history.replace('/');
        break;
      case 'failed-to-signup':
        yield put({ type: 'FAILED_TO_SIGNUP', payload: event.payload });
        break;
      default:
        break;
    }
  }
}

export default function* root() {
  yield [
    fork(watchMenu),
    fork(watchImport),
    fork(watchLogin),
    fork(watchSignUp),
    fork(watchResetPassword),
    fork(watchPort),
  ];
  const info = yield call(browser.runtime.getPlatformInfo);
  yield put({ type: 'INFO', payload: info });
}
