/* global fetch: false, Headers: false, setTimeout: false */
import browser from 'webextension-polyfill';
import config  from '../config.json';
import logger  from './logger';

function getAccessToken() {
  return browser.storage.local.get('accessToken').then((v) => {
    if (v && v.accessToken) {
      return v.accessToken;
    }
    return null;
  });
}

function setAccessToken(accessToken) {
  return browser.storage.local.set({ accessToken });
}

function getUser() {
  return browser.storage.local.get('user').then((v) => {
    if (v && v.user) {
      return v.user;
    }
    return null;
  });
}

function setUser(user) {
  return browser.storage.local.set({ user }).then(() => user);
}

function getLastSynced() {
  return browser.storage.local.get('lastSynced').then((v) => {
    if (v) {
      if (v.lastSynced instanceof Date) {
        return v.lastSynced;
      }
      const d = new Date(v.lastSynced);
      if (d.toString() === 'Invalid Date') {
        return new Date(0);
      }
      return d;
    }
    return null;
  });
}

function setLastSynced(date) {
  let lastSynced = null;
  if (date instanceof Date) {
    lastSynced = date.getTime();
  }
  return browser.storage.local.set({ lastSynced });
}

function sendRequest(method, url, params) {
  return getAccessToken().then((accessToken) => {
    const headers = new Headers();
    headers.append('Accept', 'application/json');
    headers.append('Content-type', 'application/json');
    if (accessToken && accessToken.access_token) {
      headers.append('Authorization', `Bearer ${accessToken.access_token}`);
    }
    let u = url;
    let body = null;
    if (params) {
      if (method === 'GET') {
        u += '?';
        Object.keys(params).forEach((key, i) => {
          if (i !== 0) {
            u += '&';
          }
          u += `${key}=${params[key]}`;
        });
      } else {
        body = JSON.stringify(params);
      }
    }

    logger.trace(`${method}: ${u}`);
    logger.trace('---------------- request parameter ---------------');
    logger.trace(JSON.stringify(params));

    return fetch(u, { method, headers, body })
      .then((response) => {
        logger.trace(response);
        if (response.ok) {
          return Promise.resolve(response.json());
        }
        return Promise.reject({ code: response.status });
      });
  });
}

function fetchAccessToken(email, password) {
  return getAccessToken().then((accessToken) => {
    if (accessToken) {
      return new Promise(resolve => setTimeout(() => resolve(accessToken)), 0);
    }
    return sendRequest('POST', `${config.BASE_URL}/oauth/token.json`, {
      grant_type:    'password',
      client_id:     config.CLIENT_ID,
      client_secret: config.CLIENT_SECnRET,
      username:      email,
      password,
    });
  });
}

function isLoggedIn() {
  return Promise.all([getAccessToken(), getUser()])
    .then(vals => vals[0] !== null && vals[1] !== null);
}

function signup(email, password, passwordConfirmation) {
  return sendRequest('POST', `${config.BASE_URL}/api/v1/users`, {
    email,
    password,
    password_confirmation: passwordConfirmation,
  });
}

function login(email, password) {
  return fetchAccessToken(email, password)
    .then(token => setAccessToken(token))
    .then(() => sendRequest('GET', `${config.BASE_URL}/api/v1/me.json`))
    .then(user => setUser(user));
}

function logout() {
  return setAccessToken(null)
    .then(() => setUser(null));
}

function fetchStickies(newerThan) {
  return sendRequest('GET', `${config.BASE_URL}/api/v1/stickies.json`, {
    newer_than: newerThan.toJSON(),
  });
}

function createStickies(stickies) {
  return sendRequest('POST', `${config.BASE_URL}/api/v1/stickies.json`, {
    stickies,
  });
}

export default {
  getLastSynced,
  setLastSynced,
  setAccessToken,
  fetchStickies,
  createStickies,
  signup,
  login,
  logout,
  isLoggedIn,
  getUser,
  setUser,
  signUpUrl:        `${config.BASE_URL}/users/new`,
  resetPasswordUrl: `${config.BASE_URL}/password_resets/new`,
};
