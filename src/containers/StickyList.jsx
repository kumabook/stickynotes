import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import TreeView from 'react-treeview';
import { GroupBy, OrderBy } from '../reducers/sidebar';


const noTag = { id: 'no-tag', name: 'no tag' };
function getDateString(date) {
  const year  = date.getFullYear();
  const month = `0${date.getMonth() + 1}`.slice(-2);
  const day   = `0${date.getDate()}`.slice(-2);
  return `${year}-${month}-${day}`;
}

class StickyList extends React.Component {
  static handleKeyDown() {
  }
  constructor() {
    super();
    this.state = {
      collapsedMap: {},
    };
  }
  compare() {
    switch (this.props.orderBy) {
      case OrderBy.CreatedAt:
        return (a, b) => b.created_at.getTime() - a.created_at.getTime();
      case OrderBy.UpdatedAt:
        return (a, b) => b.updated_at.getTime() - a.updated_at.getTime();
      default: // OrderBy.Alphabetical
        return (a, b) => {
          if (a < b) {
            return -1;
          }
          if (a > b) {
            return 1;
          }
          return 0;
        };
    }
  }
  handleClick(item) {
    this.state.collapsedMap[item.id] = !this.state.collapsedMap[item.id];
    this.setState({ collapsedMap: this.state.collapsedMap });
  }
  renderSticky(sticky) {
    return (
      <div onDoubleClick={() => this.props.handleStickyDoubleClick(sticky)}>
        <span className="sticky-content">{sticky.content}</span>
        <span className="sticky-top">{sticky.top}</span>
        <span className="sticky-left">{sticky.left}</span>
      </div>
    );
  }
  renderTreeView(t, items) {
    const label = (
      <span
        className="tree-label"
        role="menuitem"
        onClick={() => this.handleClick(t)}
        onKeyDown={StickyList.handleKeyDown}
        tabIndex="0"
      >
        {t.name}
      </span>
    );
    return (
      <TreeView
        key={t.name}
        nodeLabel={label}
        collapsed={!this.state.collapsedMap[t.id]}
      >
        {items}
      </TreeView>
    );
  }
  renderItem(p, stickies) {
    const label = (
      <span
        className="tree-label"
        role="menuitem"
        onClick={() => this.handleClick(p)}
        onKeyDown={StickyList.handleKeyDown}
        tabIndex="0"
      >
        {p.title}
      </span>
    );
    const items = stickies.map(sticky => this.renderSticky(sticky));
    return (
      <TreeView
        key={p.id}
        nodeLabel={label}
        collapsed={!this.state.collapsedMap[p.id]}
      >
        {items}
      </TreeView>
    );
  }
  renderPages(stickies) {
    const pages = this.props.pages.filter(p => stickies.some(s => s.page.id === p.id));
    return pages.map((p) => {
      const vals = stickies.filter(s => s.page.id === p.id).sort(this.compare());
      return this.renderItem(p, vals);
    });
  }
  renderDateStickies(stickies) {
    const pages = [];
    stickies.forEach((s) => {
      if (!pages.find(p => p.id === s.page.id)) {
        const p = this.props.pages.find(v => v.id === s.page.id);
        if (p) {
          pages.push(p);
        }
      }
    });
    return pages.map((p) => {
      const vals = stickies.filter(s => s.page.id === p.id);
      return this.renderItem(p, vals);
    });
  }
  renderGroupByDate(key) {
    const stickiesOfDate = {};
    const stickies = this.props.stickies.sort(this.compare());
    stickies.forEach((s) => {
      const d = getDateString(s[key]);
      if (!stickiesOfDate[d]) {
        stickiesOfDate[d] = [];
      }
      stickiesOfDate[d].push(s);
    });
    return Object.keys(stickiesOfDate)
      .sort()
      .reverse()
      .map(d => this.renderTreeView(
        { id: d, name: d },
        this.renderDateStickies(stickiesOfDate[d]),
      ));
  }
  renderGroupByCreatedAtTree() {
    return this.renderGroupByDate('created_at');
  }
  renderGroupByUpdatedAtTree() {
    return this.renderGroupByDate('updated_at');
  }
  renderGroupByTagSiteTree() {
    const trees =  this.props.tags.map((t) => {
      const stickies = this.props.stickies.filter(s => s.tags.some(tag => t.id === tag.id));
      return this.renderTreeView(t, this.renderPages(stickies));
    });
    const noTagStickies = this.props.stickies.filter(s => s.tags.length === 0);
    if (noTagStickies.length > 0) {
      const items = this.renderPages(noTagStickies);
      trees.push(this.renderTreeView(noTag, items));
    }
    return trees;
  }
  renderGroupBySiteTree() {
    const compare = (a, b) => a.title.localeCompare(b.title);
    return this.props.pages.sort(compare).map((p) => {
      const vals = this.props.stickies
        .filter(s => s.page.id === p.id)
        .sort(compare);
      return this.renderItem(p, vals);
    });
  }
  renderGroupByTagTree() {
    const compare = (a, b) => a.name.localeCompare(b.name);
    const trees =  this.props.tags.sort(compare).map((t) => {
      const items = this.props.stickies
        .filter(s => s.tags.some(tag => t.id === tag.id))
        .map(sticky => this.renderSticky(sticky));
      if (items.length > 0) {
        return this.renderTreeView(t, items);
      }
      return null;
    });
    const noTagStickies = this.props.stickies.filter(s => s.tags.length === 0);
    if (noTagStickies.length > 0) {
      const items = noTagStickies.map(sticky => this.renderSticky(sticky));
      trees.push(this.renderTreeView(noTag, items));
    }
    return trees;
  }
  renderTrees() {
    switch (this.props.groupBy) {
      case GroupBy.CreatedAt:
        return this.renderGroupByCreatedAtTree();
      case GroupBy.UpdatedAt:
        return this.renderGroupByUpdatedAtTree();
      case GroupBy.TagSite:
        return this.renderGroupByTagSiteTree();
      case GroupBy.Site:
        return this.renderGroupBySiteTree();
      case GroupBy.Tag:
        return this.renderGroupByTagTree();
      default:
        return [];
    }
  }
  render() {
    const groupByOptions = Object.keys(GroupBy).map((key) => {
      const value = GroupBy[key];
      return (
        <option
          key={key}
          selected={this.props.groupBy === value}
          value={value}
        >
          {value}
        </option>
      );
    });
    return (
      <div>
        <div className="header">
          <label htmlFor="searchInput" className="search-label">Search
            <input
              id="searchInput"
              className="search-input"
              type="search"
              name="search"
              size="10"
              maxLength="255"
              value={this.props.searchQuery}
              onChange={e => this.props.handleSearchQueryChange(e.target.value)}
            />
          </label>
          <select
            value={this.props.groupBy}
            className="groupby-select"
            onChange={e => this.props.handleGroupByChange(e.target.value)}
          >
            {groupByOptions}
          </select>
        </div>
        {this.renderTrees()}
      </div>
    );
  }
}

function search(query, sticky) {
  const q = query.toLowerCase();
  if (sticky.content.toLowerCase().indexOf(q) !== -1) {
    return true;
  }
  if (sticky.page.title.toLowerCase().indexOf(q) !== -1) {
    return true;
  }
  return !sticky.tags.every(t => t.name.toLowerCase().indexOf(q) === -1);
}

StickyList.propTypes = {
  searchQuery:             PropTypes.string.isRequired,
  orderBy:                 PropTypes.string.isRequired,
  groupBy:                 PropTypes.string.isRequired,
  stickies:                PropTypes.arrayOf(PropTypes.object).isRequired,
  tags:                    PropTypes.arrayOf(PropTypes.object).isRequired,
  pages:                   PropTypes.arrayOf(PropTypes.object).isRequired,
  handleStickyDoubleClick: PropTypes.func.isRequired,
  handleGroupByChange:     PropTypes.func.isRequired,
  handleSearchQueryChange: PropTypes.func.isRequired,
};

function mapStateToProps(state) {
  let { stickies } = state;
  const q = state.searchQuery.trim();
  if (q.length > 0) {
    stickies = stickies.filter(s => search(q, s));
  }
  return {
    stickies,
    tags:        state.tags,
    pages:       state.pages,
    searchQuery: state.searchQuery,
    groupBy:     state.groupBy,
    orderBy:     state.orderBy,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    handleStickyDoubleClick: payload => dispatch({ type: 'JUMP_TO_STICKY', payload }),
    handleGroupByChange:     payload => dispatch({ type: 'CHANGE_GROUP_BY', payload }),
    handleSearchQueryChange: payload => dispatch({ type: 'CHANGE_SEARCH_QUERY', payload }),
  };
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(StickyList));
