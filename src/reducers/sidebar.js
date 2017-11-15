import { combineReducers } from 'redux';
import { routerReducer }   from 'react-router-redux';


export const OrderBy = {
  Alphabetical: 0,
  CreatedAt:    1,
  UpdatedAt:    2,

  compare: (orderby, a, b) => {
    switch (orderby) {
      case OrderBy.Alphabetical:
        return a.content > b.content;
      case OrderBy.CreatedAt:
        return Date.parse(a.created_at) < Date.parse(b.created_at);
      case OrderBy.UpdatedAt:
        return Date.parse(a.updated_at) < Date.parse(b.updated_at);
      default:
        return a.content > b.content;
    }
  },
};

export const GroupBy = {
  UpdatedAt: 'Updated',
  CreatedAt: 'Created',
  TagSite:   'Tag+Site',
  Site:      'Site',
  Tag:       'Tag',
};

function addTags(items, tags) {
  return tags.reduce((acc, tag) => {
    if (!acc.find(t => tag.id === t.id)) {
      acc.push(tag);
    }
    return acc;
  }, items);
}

function addPage(items, page) {
  if (!items.find(p => p.id === page.id)) {
    items.push(page);
  }
  return items;
}

const user = (state = {}, action) => {
  switch (action.type) {
    default:
      return state;
  }
};

const stickies = (state = [], action) => {
  switch (action.type) {
    case 'FETCHED_STICKIES':
      return action.payload.stickies;
    case 'CREATED_STICKIES':
      return state.concat([action.payload]);
    case 'SAVED_STICKIES':
      return state.map((sticky) => {
        if (sticky.id === action.payload.id) {
          return action.payload;
        }
        return sticky;
      });
    case 'DELETED_STICKIES':
      return state.filter(s => s.id !== action.payload.id);
    case 'CLEARED_STICKIES':
      return [];
    default:
      return state;
  }
};

const tags = (state = [], action) => {
  switch (action.type) {
    case 'FETCHED_STICKIES':
      return action.payload.tags;
    case 'CREATED_STICKIES':
      return addTags(state.slice(), action.payload.tags);
    case 'SAVED_STICKIES':
      return addTags(state.slice(), action.payload.tags);
    case 'CLEARED_STICKIES':
      return [];
    default:
      return state;
  }
};

const pages = (state = [], action) => {
  switch (action.type) {
    case 'FETCHED_STICKIES':
      return action.payload.pages;
    case 'CREATED_STICKIES':
      return addPage(state.slice(), action.payload.page);
    case 'SAVED_STICKIES':
      return addPage(state.slice(), action.payload.page);
    case 'CLEARED_STICKIES':
      return [];
    default:
      return state;
  }
};

const searchQuery = (state = '', action) => {
  switch (action.type) {
    case 'CHANGE_SEARCH_QUERY':
      return action.payload;
    default:
      return state;
  }
};

const orderBy = (state = OrderBy.Alphabetical, action) => {
  switch (action.type) {
    case 'CHANGE_GROUP_BY':
      switch (action.payload) {
        case GroupBy.CreatedAt:
          return OrderBy.CreatedAt;
        case GroupBy.UpdatedAt:
          return OrderBy.UpdatedAt;
        default:
          return OrderBy.Alphabetical;
      }
    default:
      return state;
  }
};

const groupBy = (state = GroupBy.UpdatedAt, action) => {
  switch (action.type) {
    case 'CHANGE_GROUP_BY':
      return action.payload;
    default:
      return state;
  }
};

const rootReducer = combineReducers({
  router: routerReducer,
  user,
  stickies,
  tags,
  pages,
  searchQuery,
  orderBy,
  groupBy,
});

export default rootReducer;
