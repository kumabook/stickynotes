import { combineReducers } from 'redux';
import { routerReducer }   from 'react-router-redux';

const user = (state = null, action) => {
  switch (action.type) {
    case 'LOGGED_IN':
      return action.payload;
    case 'LOGGED_OUT':
      return null;
    default:
      return state;
  }
};

const loginStatus = (state = { type: 'waiting' }, action) => {
  switch (action.type) {
    case 'LOGIN':
      return { type: 'starting' };
    case 'LOGGED_IN':
      return { type: 'succeeded' };
    case 'LOGGED_OUT':
      return { type: 'waiting' };
    case 'FAILED_TO_LOGIN':
      return { type: 'failed', error: action.payload };
    default:
      return state;
  }
};

const signupStatus = (state = { type: 'waiting' }, action) => {
  switch (action.type) {
    case 'SIGNUP':
      return { type: 'starting' };
    case 'SIGNED_UP':
      return { type: 'succeeded' };
    case 'FAILED_TO_SIGNUP':
      return { type: 'failed', error: action.payload };
    default:
      return state;
  }
};

const confirm = (state = false, action) => {
  switch (action.type) {
    case 'CONFIRM_CLEAR_CACHE':
      return true;
    case 'HIDE_CONFIRM':
      return false;
    default:
      return state;
  }
};

const rootReducer = combineReducers({
  router: routerReducer,
  user,
  loginStatus,
  signupStatus,
  confirm,
});

export default rootReducer;
