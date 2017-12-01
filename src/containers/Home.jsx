/* global confirm: false */
import browser from 'webextension-polyfill';
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { isJSON } from '../utils/file';
import getMessage from '../utils/i18n';
import Confirm from '../components/Confirm';

class Home extends React.Component {
  static canOpenSidebar() {
    return browser.sidebarAction && browser.sidebarAction.open;
  }
  menus() {
    let menus = [];
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
                  onClick={() => this.props.handleClick(m, this.filePicker)}
                  onKeyDown={() => {}}
                  tabIndex="0"
                >
                  {getMessage(m)}
                </span>
              </li>
             ))}
          </ul>
          <input
            ref={(input) => { this.filePicker = input; }}
            type="file"
            style={{ position: 'fixed', top: 10, display: 'none' }}
            onChange={e => this.props.handleInputFiles(e.target.files)}
          />
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
    os: PropTypes.string.isRequired,
  }).isRequired,
  user:             PropTypes.shape({}).isRequired,
  confirm:          PropTypes.bool.isRequired,
  handleClick:      PropTypes.func.isRequired,
  handleConfirm:    PropTypes.func.isRequired,
  handleInputFiles: PropTypes.func.isRequired,
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
    handleClick: (menu, filePicker) => {
      switch (menu) {
        case 'login':
          history.push('/login');
          break;
        case 'import':
          filePicker.click();
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
    handleInputFiles: (files) => {
      dispatch({ type: 'IMPORT', payload: [] });
      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        dispatch({ type: 'IMPORT', payload: [] });
        if (isJSON(file)) {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const data = JSON.parse(reader.result);
              dispatch({ type: 'IMPORT', payload: data });
            } catch (e) {
              dispatch({ type: 'IMPORT_FAIL', payload: e });
            }
          };
          reader.readAsText(file);
        }
      }
    },
  };
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Home));
