/* global confirm: false */
/* global chrome */
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { isJSON } from '../utils/file';
import getMessage from '../utils/i18n';

class OptionsUI extends React.Component {
  renderCanMoveFocusByTab() {
    return (
      <div>
        <h4 className="optionsLabel">Tab behavior</h4>
        <input
          className="optionsValueInput"
          type="checkbox"
          checked={this.props.canMoveFocusByTab}
          onChange={e => this.props.handleCanMoveFocusByTabChange(e.target.checked)}
        />
        On ... Move focus by tab, Off ... Enter tab
      </div>
    );
  }

  renderSetOnPremise() {
    return (
      <div>
        <h4 className="optionsLabel">On Premise</h4>
        <input
          className="optionsValueInput"
          type="checkbox"
          checked={this.props.hasCustomBaseUrl}
          onChange={e => {
            this.props.hasCustomBaseUrl = e.target.checked;
            this.props.handleUseCustomerBackupServer(this.props);
          }}
        />
        Use a custom backend server
        {this.props.hasCustomBaseUrl && ['BASE_URL', 'CLIENT_ID', 'CLIENT_SECRET'].map((key)=> <div key={key}>
          <input
            className="optionsValueTextInput"
            type="text"
            name={key}
            value={this.props[key]}
            onChange={e => {
              this.props[key] = e.target.value;
              this.props.handleUseCustomerBackupServer(this.props);
            }}
          />
          &nbsp;{key}
        </div>)}
        {this.props.hasCustomBaseUrl && this.props.BASE_URL && this.props.BASE_URL != "" && (
          <div>
            <div className="optionsDescription">You can get a client id and a client secret <a href={`${this.props.BASE_URL}/oauth/applications`}>here</a></div>
            <input class="optionsDescription" type="button" value="Authorize" onClick={()=>{chrome.permissions.request({origins: [this.props['BASE_URL']]})}} /> Allow the web-extension to backup data on this domain
          </div>
        )}
      </div>
    );
  }

  renderFiles() {
    return (
      <div>
        <h4 className="optionsLabel">Files</h4>
        <button onClick={() => this.filePicker.click()}>{getMessage('import')}</button>
        <button onClick={this.props.exportAsJson}>{getMessage('export')}</button>
        <button onClick={this.props.exportAsCsv}>{getMessage('export_as_csv')}</button>
        <input
          ref={(input) => { this.filePicker = input; }}
          type="file"
          style={{ position: 'fixed', top: 10, display: 'none' }}
          onChange={e => this.props.handleInputFiles(e.target.files)}
        />
      </div>
    );
  }

  render() {
    return (
      <div>
        {this.renderFiles()}
        {this.renderCanMoveFocusByTab()}
        {this.renderSetOnPremise()}
      </div>
    );
  }
}

OptionsUI.propTypes = {
  exportAsJson:                  PropTypes.func.isRequired,
  exportAsCsv:                   PropTypes.func.isRequired,
  handleInputFiles:              PropTypes.func.isRequired,
  handleCanMoveFocusByTabChange: PropTypes.func.isRequired,
  canMoveFocusByTab:             PropTypes.bool.isRequired,
  handleUseCustomerBackupServer: PropTypes.func.isRequired,
  hasCustomBaseUrl:              PropTypes.func.isRequired,
  BASE_URL:                      PropTypes.string,
  CLIENT_ID:                     PropTypes.string,
  CLIENT_SECRET:                 PropTypes.string,
};

OptionsUI.defaultProps = {
};

function mapStateToProps(state) {
  return {
    canMoveFocusByTab: state.canMoveFocusByTab,
    hasCustomBaseUrl:  state.hasCustomBaseUrl,
    BASE_URL:          state.BASE_URL,
    CLIENT_ID:         state.CLIENT_ID,
    CLIENT_SECRET:     state.CLIENT_SECRET,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    exportAsJson:     () => dispatch({ type: 'EXPORT', payload: 'json' }),
    exportAsCsv:      () => dispatch({ type: 'EXPORT', payload: 'csv' }),
    handleInputFiles: (files) => {
      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
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
    handleCanMoveFocusByTabChange: payload => dispatch({
      type: 'UPDATE_CAN_MOVE_FOCUS_BY_TAB',
      payload,
    }),
    handleUseCustomerBackupServer: payload => dispatch({
      type: 'UPDATE_USE_CUSTOM_BACKUP_SERVER',
      payload,
    }),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(OptionsUI);
