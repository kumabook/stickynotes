/* global confirm: false */
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { isJSON } from '../utils/file';
import getMessage from '../utils/i18n';

class OptionsUI extends React.Component {
  render() {
    return (
      <div>
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
}

OptionsUI.propTypes = {
  exportAsJson:     PropTypes.func.isRequired,
  exportAsCsv:      PropTypes.func.isRequired,
  handleInputFiles: PropTypes.func.isRequired,
};

OptionsUI.defaultProps =  {
};

function mapStateToProps() {
  return {};
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
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(OptionsUI);
