import React     from 'react';
import PropTypes from 'prop-types';

const Confirm = ({ hidden, title, message, onSubmit }) => {
  const style = { display: hidden ? 'none' : '' };
  return (
    <div className="confirmContainer" style={style}>
      <div className="confirmContent">
        <div className="confirmMessage">{message}</div>
        <button className="confirmOKButton" onClick={() => onSubmit(true)}>OK</button>
        <button className="confirmNOButton" onClick={() => onSubmit(false)}>No</button>
      </div>
    </div>
  );
};

Confirm.propTypes = {
  hidden:  PropTypes.bool,
  title:   PropTypes.string,
  message: PropTypes.string,
  ok:      PropTypes.func,
  no:      PropTypes.func,
};
Confirm.defaultProps = {
  hidden:  true,
  title:   '',
  message: '',
  ok:      () => {},
  no:      () => {},
};

export default Confirm;
