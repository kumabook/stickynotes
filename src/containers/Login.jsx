import React    from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter, Link } from 'react-router-dom';
import getMessage from '../utils/i18n';

class Login extends React.Component {
  getErrorMessage() {
    if (this.props.loginStatus.type === 'failed') {
      let message = getMessage('loginError');
      switch (this.props.loginStatus.type) {
        case 401:
          message = getMessage('loginErrorInvalid');
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
  back() {
    this.props.history.goBack();
  }
  handleSubmit(e) {
    e.preventDefault();
    if (this.props.loginStatus.type === 'starting') {
      return;
    }
    this.props.login(this.email.value, this.password.value);
  }
  render() {
    return (
      <div className="container">
        <div className="navBar">
          <span
            role="button"
            onClick={() => this.back()}
            onKeyDown={() => {}}
            tabIndex="0"
          >{getMessage('back')}
          </span>
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
          <input className="loginButton" type="submit" value={getMessage('login')} />
        </form>
        <div><Link to="/signup">{getMessage('signup')}</Link></div>
        <div>
          <a
            href="reset_password"
            onClick={(e) => {
              e.preventDefault();
              this.props.resetPassword();
            }}
          >
            {getMessage('resetPassword')}
          </a>
        </div>
      </div>
    );
  }
}

Login.propTypes = {
  loginStatus: PropTypes.shape({
    type: PropTypes.string.isRequired,
  }).isRequired,
  history:       PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  login:         PropTypes.func.isRequired,
  resetPassword: PropTypes.func.isRequired,
};

function mapStateToProps(state) {
  return {
    loginStatus: state.loginStatus,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    login:         (email, password) => dispatch({ type: 'LOGIN', payload: { email, password } }),
    resetPassword: () => dispatch({ type: 'RESET_PASSWORD' }),
  };
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Login));
