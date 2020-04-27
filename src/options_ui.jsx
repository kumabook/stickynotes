import 'regenerator-runtime/runtime';
import browser from 'webextension-polyfill';
import logger   from 'kiroku';
import React    from 'react';
import { Provider }  from 'react-redux';
import createSagaMiddleware from 'redux-saga';
import {
  applyMiddleware,
  createStore,
} from 'redux';
import OptionsUI from './containers/OptionsUI';
import reducers from './reducers/options_ui';
import rootSaga from './sagas/options_ui';
import { start as appStart, stop } from './utils/app';

if (process.env.NODE_ENV === 'production') {
  logger.setLevel('INFO');
}

export function start() {
  return browser.storage.local.get().then((state) => {
    const container = document.getElementById('container');
    const sagaMiddleware = createSagaMiddleware();
    const store = createStore(reducers, state, applyMiddleware(sagaMiddleware));
    store.dispatch({ type: 'INIT' });
    const element = (
      <Provider store={store}>
        <OptionsUI />
      </Provider>
    );
    return appStart(container, element, sagaMiddleware, rootSaga);
  });
}

export { stop };

export default start();
