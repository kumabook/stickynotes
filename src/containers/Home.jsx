/* global browser: false */
import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { isJSON } from '../utils/file';
import { getMessage } from '../utils/i18n';

const MENUS = [
//  'import',
//  'export',
  'sidebar',
  'toggle',
  'create',
//  'search',
//  'display-option',
//  'preference',
];

class Home extends React.Component {
  menus() {
    if (this.props.user) {
      return MENUS.concat(['sync', 'logout']);
    }
    return MENUS.concat('login');
  }
  render() {
    return (
      <div className="home">
        <ul className="ul">
          {this.menus().map(m => (
            <li className="li" key={m}>
              <a
                className="menuItem"
                onClick={() => this.props.handleClick(m, this.filePicker)}
              >
                {getMessage(m)}
              </a>
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
    );
  }
}

function mapStateToProps(state) {
  return {
    user: state.user,
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
        default:
          dispatch({ type: 'MENU', payload: { name: menu } });
          break;
      }
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
