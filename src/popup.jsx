import 'regenerator-runtime/runtime';
import logger        from 'kiroku';
import React         from 'react';
import ReactDOM      from 'react-dom';
import createHistory from 'history/createHashHistory';
import {
  Provider,
}  from 'react-redux';
import createSagaMiddleware from 'redux-saga';
import {
  applyMiddleware,
  createStore,
} from 'redux';
import {
  ConnectedRouter,
  routerMiddleware,
} from 'react-router-redux';
import {
  HashRouter,
  Switch,
  Route,
} from 'react-router-dom';

import Home          from './containers/Home';
import Login         from './containers/Login';
import SignUp        from './containers/SignUp';

import reducers from './reducers/popup';
import rootSaga from './sagas/popup';

if (process.env.NODE_ENV === 'production') {
  logger.setLevel('INFO');
}

const history = createHistory();
const sagaMiddleware = createSagaMiddleware();
const store = createStore(reducers, applyMiddleware(
  sagaMiddleware,
  routerMiddleware(history),
));
sagaMiddleware.run(rootSaga);

const element = (
  <Provider store={store}>
    <ConnectedRouter history={history}>
      <HashRouter>
        <Switch>
          <Route path="/login" component={Login} />
          <Route path="/signup" component={SignUp} />
          <Route default component={Home} />
        </Switch>
      </HashRouter>
    </ConnectedRouter>
  </Provider>
);
ReactDOM.render(element, document.getElementById('container'));
