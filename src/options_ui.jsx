import 'regenerator-runtime/runtime';
import logger   from 'kiroku';
import React    from 'react';
import ReactDOM from 'react-dom';
import {
  Provider,
}  from 'react-redux';
import createSagaMiddleware from 'redux-saga';
import {
  applyMiddleware,
  createStore,
} from 'redux';
import OptionsUI from './containers/OptionsUI';
import reducers from './reducers/options_ui';
import rootSaga from './sagas/options_ui';

if (process.env.NODE_ENV === 'production') {
  logger.setLevel('INFO');
}

const sagaMiddleware = createSagaMiddleware();
const store = createStore(reducers, applyMiddleware(
  sagaMiddleware,
));
sagaMiddleware.run(rootSaga);

const element = (
  <Provider store={store}>
    <OptionsUI />
  </Provider>
);

ReactDOM.render(element, document.getElementById('container'));
