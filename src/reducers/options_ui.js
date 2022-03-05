import { combineReducers } from 'redux';

const canMoveFocusByTab = (state = true, action) => {
  switch (action.type) {
    case 'UPDATE_CAN_MOVE_FOCUS_BY_TAB':
      return action.payload;
    default:
      return state;
  }
};

const hasCustomBaseUrl = (state = false, action) => {
  switch (action.type) {
    case 'UPDATE_USE_CUSTOM_BACKUP_SERVER':
      return action.payload.hasCustomBaseUrl;
    default:
      return state;
  }
};

const BASE_URL = (state = "", action) => {
  switch (action.type) {
    case 'UPDATE_USE_CUSTOM_BACKUP_SERVER':
      return action.payload.BASE_URL;
    default:
      return state;
  }
};

const CLIENT_ID = (state = "", action) => {
  switch (action.type) {
    case 'UPDATE_USE_CUSTOM_BACKUP_SERVER':
      return action.payload.CLIENT_ID;
    default:
      return state;
  }
};

const CLIENT_SECRET = (state = "", action) => {
  switch (action.type) {
    case 'UPDATE_USE_CUSTOM_BACKUP_SERVER':
      return action.payload.CLIENT_SECRET;
    default:
      return state;
  }
};


const rootReducer = combineReducers({
  canMoveFocusByTab,
  hasCustomBaseUrl,
  BASE_URL,
  CLIENT_ID,
  CLIENT_SECRET,
});

export default rootReducer;
