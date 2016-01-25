const promise        = require('sdk/core/promise');
const xhr            = require("sdk/net/xhr");
const timers         = require('sdk/timers');
const XMLHttpRequest = xhr.XMLHttpRequest;
const prefService    = require("sdk/preferences/service");
const config         = require("./config");

function isLoggedIn() {
  return getAccessToken() !== null && getUser() !== null;
};

function getAccessToken() {
  return JSON.parse(prefService.get('extensions.stickynotes.access_token',
                                    null));
}

function setAccessToken(accessToken) {
  prefService.set('extensions.stickynotes.access_token',
                  JSON.stringify(accessToken));
}

function getUser() {
  return JSON.parse(prefService.get('extensions.stickynotes.user',
                                    null));
}

function setUser(user) {
  return prefService.set('extensions.stickynotes.user',
                         JSON.stringify(user));
};

function sendRequest(method, url, params) {
  var deferred = promise.defer();
  let req = new XMLHttpRequest();
  if (params && method === 'GET') {
    url += '?';
    Object.keys(params).forEach(function (key, i) {
      if (i !== 0) url += '&';
      url += key + '=' + params[key];
    });
  }
  req.open(method, url, true);
  req.setRequestHeader('Accept', 'application/json');
  req.setRequestHeader('Content-type', 'application/json');
  var accessToken = getAccessToken();
  if (accessToken && accessToken.access_token) {
    req.setRequestHeader('Authorization', 'Bearer ' + accessToken.access_token);
  }

  req.onload = function() {
    console.log('---------------- response body ---------------');
    //    console.log(req.responseText);
    if (req.status >= 400) {
      deferred.reject(JSON.parse(req.responseText));
    } else {
      deferred.resolve(JSON.parse(req.responseText));
    }
  };
  req.onabort = function(event) {
    deferred.reject(event);
  };
  req.onerror = function(event) {
    deferred.reject(event);
  };
  console.log(method + ': ' + url);
  console.log('---------------- request parameter ---------------');
  console.log(JSON.stringify(params));
  if (method === 'GET') {
    req.send();
  } else {
    req.send(JSON.stringify(params));
  }
  return deferred.promise;
};

function fetchAccessToken(email, password) {
  var accessToken = getAccessToken();
  if (accessToken === null) {
    return sendRequest('POST', config.rootUrl + '/oauth/token.json', {
      grant_type: 'password',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      username: email,
      password: password
    });
  } else {
    var dfd = promise.defer();
    timers.setTimeout(function() {
      dfd.resolve(accessToken);
    }, 0);
    return dfd.promise;
  }
};

function login(email, password) {
  return fetchAccessToken(email, password).then(function(token) {
    setAccessToken(token);
    return sendRequest('GET', config.rootUrl + '/api/v1/me.json').then(function(user) {
      setUser(user);
      return user;
    });
  });
}

function logout() {
  setAccessToken(null);
  setUser(null);
};

function fetchStickies(newerThan) {
  return sendRequest('GET', config.rootUrl + '/api/v1/stickies.json', {
    newer_than: newerThan.toJSON()
  });
};

function createStickies(stickies) {
  return sendRequest('POST', config.rootUrl + '/api/v1/stickies.json', {
    stickies: stickies
  });
};

module.exports = {
  fetchStickies: fetchStickies,
  createStickies: createStickies,
  login: login,
  logout: logout,
  isLoggedIn: isLoggedIn,
  signUpUrl: config.rootUrl + '/users/new',
  resetPasswordUrl: config.rootUrl + '/password_resets/new'
};
