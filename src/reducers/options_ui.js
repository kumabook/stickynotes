import { combineReducers } from 'redux';

const canMoveFocusByTab = (state = true, action) => {
  switch (action.type) {
    case 'UPDATE_CAN_MOVE_FOCUS_BY_TAB':
      return action.payload;
    default:
      return state;
  }
};


const rootReducer = combineReducers({
  canMoveFocusByTab,
});

export default rootReducer;
