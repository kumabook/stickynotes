import React     from 'react';
import PropTypes from 'prop-types';

const Confirm = ({
  hidden, message, onSubmit,
}) => {
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
  hidden:   PropTypes.bool,
  message:  PropTypes.string,
  onSubmit: PropTypes.func,
};
Confirm.defaultProps = {
  hidden:   true,
  message:  '',
  onSubmit: () => {},
};

export default Confirm;
