import {
  router,
  createHashHistory,
} from 'redux-saga-router';
import { fork, put } from 'redux-saga/effects';

const history = createHashHistory();
//export const getSerachParams = () => new URLSearchParams(history.location.search);

const routes = {
  '/stickies': function* fetchStickies() {
    yield put({ type: 'FETCH_STICKIES' });
  },
};

export default function* routerSaga() {
  yield fork(router, history, routes);
}
