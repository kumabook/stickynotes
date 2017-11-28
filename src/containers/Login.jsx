import React    from 'react';
import { connect } from 'react-redux';
import { withRouter, Link } from 'react-router-dom';
import { getMessage } from '../utils/i18n';

class Login extends React.Component {
  back() {
    this.props.history.goBack();
  }
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
  render() {
    return (
      <div className="container">
        <div className="navBar"><a onClick={() => this.back()}>{getMessage('back')}</a></div>
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
            href=""
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
  handleSubmit(e) {
    e.preventDefault();
    if (this.props.loginStatus.type === 'starting') {
      return;
    }
    this.props.login(this.email.value, this.password.value);
  }
}

function mapStateToProps(state) {
  return {
    loginStatus: state.loginStatus,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    login: (email, password) => dispatch({ type: 'LOGIN', payload: { email, password } }),
    resetPassword: () => dispatch({ type: 'RESET_PASSWORD' }),
  };
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Login));
