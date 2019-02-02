/* global confirm: false */
import browser from 'webextension-polyfill';
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import getMessage from '../utils/i18n';
import Confirm from '../components/Confirm';

class Home extends React.Component {
  static canOpenSidebar() {
    return browser.sidebarAction && browser.sidebarAction.open;
  }
  menus() {
    let menus = ['options'];
    switch (this.props.info.os) {
      case 'android':
        menus.push('list');
        break;
      default:
        menus.push('list');
        if (Home.canOpenSidebar()) {
          menus.push('sidebar');
        }
        menus = menus.concat(['toggle', 'create']);
        break;
    }
    if (this.props.user) {
      menus = menus.concat(['sync', 'logout', 'clearCache']);
    } else {
      menus = menus.concat(['login']);
    }
    return menus;
  }
  render() {
    return (
      <div>
        <div className="home">
          <ul className="ul">
            {this.menus().map(m => (
              <li className="li" key={m}>
                <span
                  role="button"
                  className="menuItem"
                  onClick={() => this.props.handleClick(m)}
                  onKeyDown={() => {}}
                  tabIndex="0"
                >
                  {getMessage(m)}
                </span>
              </li>
             ))}
          </ul>
        </div>
        <Confirm
          hidden={!this.props.confirm}
          title={getMessage('clearCache')}
          message={getMessage('clearCacheConfirmMessage')}
          onSubmit={result => this.props.handleConfirm(result)}
        />
      </div>
    );
  }
}

Home.propTypes = {
  info: PropTypes.shape({
    os: PropTypes.string,
  }).isRequired,
  user:          PropTypes.shape({}),
  confirm:       PropTypes.bool.isRequired,
  handleClick:   PropTypes.func.isRequired,
  handleConfirm: PropTypes.func.isRequired,
};
Home.defaultProps =  {
  user: null,
};

function mapStateToProps(state) {
  return {
    info:    state.info,
    user:    state.user,
    confirm: state.confirm,
  };
}

function mapDispatchToProps(dispatch, { history }) {
  return {
    handleClick: (menu) => {
      switch (menu) {
        case 'login':
          history.push('/login');
          break;
        case 'options':
          browser.runtime.openOptionsPage();
          break;
        case 'sidebar':
          browser.sidebarAction.open();
          break;
        case 'clearCache':
          dispatch({ type: 'CONFIRM_CLEAR_CACHE' });
          break;
        default:
          dispatch({ type: 'MENU', payload: { name: menu } });
          break;
      }
    },
    handleConfirm: (result) => {
      if (result) {
        dispatch({ type: 'MENU', payload: { name: 'clearCache' } });
      }
      dispatch({ type: 'HIDE_CONFIRM' });
    },
  };
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Home));
