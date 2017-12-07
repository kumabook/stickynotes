import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import getMessage from '../utils/i18n';

class SignUp extends React.Component {
  getErrorMessage() {
    if (this.props.signupStatus.type === 'failed') {
      let message = getMessage('signupError');
      switch (this.props.signupStatus.type) {
        case 401:
          message = getMessage('signupError');
          break;
        default:
          break;
      }
      return (
        <p className="errorMessage">
          {message}
        </p>
      );
    }
    return null;
  }
  handleSubmit(e) {
    e.preventDefault();
    if (this.props.signupStatus.type === 'starting') {
      return;
    }
    this.props.signup(
      this.email.value,
      this.password.value,
      this.passwordConfirmation.value,
    );
  }
  back() {
    this.props.history.goBack();
  }
  render() {
    return (
      <div className="container">
        <div className="navBar">
          <button
            className="backButton"
            onClick={() => this.back()}
          >
            {getMessage('back')}
          </button>
        </div>
        <p>
          {getMessage('accountDescription')}
        </p>
        {this.getErrorMessage()}
        <form onSubmit={e => this.handleSubmit(e)}>
          <label htmlFor="email">{getMessage('email')}
            <input
              id="email"
              className="userNameInput"
              type="text"
              name="username"
              size="20"
              ref={(email) => { this.email = email; }}
            />
          </label>
          <label htmlFor="password">{getMessage('password')}
            <input
              id="password"
              className="passwordInput"
              type="password"
              name="password"
              size="20"
              ref={(password) => { this.password = password; }}
            />
          </label>
          <label htmlFor="password_confirmation">{getMessage('passwordConfirmation')}
            <input
              id="password_confirmation"
              className="passwordInput"
              type="password"
              name="password_confirmation"
              size="20"
              ref={(passwordConfirmation) => { this.passwordConfirmation = passwordConfirmation; }}
            />
          </label>
          <input className="loginButton" type="submit" value={getMessage('signup')} />
        </form>
      </div>
    );
  }
}

SignUp.propTypes = {
  history:      PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  signupStatus: PropTypes.string.isRequired,
  signup:       PropTypes.func.isRequired,
};

function mapStateToProps(state) {
  return {
    signupStatus: state.signupStatus,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    signup: (email, password, passwordConfirmation) => dispatch({
      type:    'SIGNUP',
      payload: {
        email,
        password,
        passwordConfirmation,
      },
    }),
  };
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(SignUp));
