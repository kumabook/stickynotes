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
  Redirect,
} from 'react-router-dom';
import StickyList from './containers/StickyList';
import reducers from './reducers/sidebar';
import rootSaga from './sagas/sidebar';

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
      <HashRouter onChange={() => this.handleRoute}>
        <Switch>
          <Route path="/stickies" component={StickyList} />
          <Redirect default to="/stickies" />
        </Switch>
      </HashRouter>
    </ConnectedRouter>
  </Provider>
);
ReactDOM.render(element, document.getElementById('container'));
