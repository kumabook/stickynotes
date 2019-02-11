/* global confirm: false */
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
};

OptionsUI.defaultProps = {
};

function mapStateToProps(state) {
  return {
    canMoveFocusByTab: state.canMoveFocusByTab,
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
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(OptionsUI);
