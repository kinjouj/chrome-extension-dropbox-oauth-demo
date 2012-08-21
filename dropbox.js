const OAUTH_TOKEN_KEY = "oauth_token";
const OAUTH_TOKEN_SECRET_KEY = "oauth_token_secret";

var Dropbox = function() {};

Dropbox.prototype.getToken = function() {
  return localStorage.getItem(OAUTH_TOKEN_KEY);
};

Dropbox.prototype.setToken = function(token) {
  if (_.isString(token)) {
    localStorage.setItem(OAUTH_TOKEN_KEY, token);
  }
};

Dropbox.prototype.getTokenSecret = function() {
  return localStorage.getItem(OAUTH_TOKEN_SECRET_KEY);
};

Dropbox.prototype.setTokenSecret = function(tokenSecret) {
  if (_.isString(tokenSecret)) {
    return localStorage.setItem(OAUTH_TOKEN_SECRET_KEY, tokenSecret);
  }
};

Dropbox.prototype.getAuthorized = function() {
  var authorized = localStorage.getItem("authorized");

  return _.isString(authorized) && authorized === "true" ? true : false;
};

Dropbox.prototype.setAuthorized = function() {
  localStorage.setItem("authorized", true);
};

Dropbox.prototype.isAuthorized = function() {
  return _.isString(this.getToken()) && _.isString(this.getTokenSecret()) && this.getAuthorized() === true ? true : false;
};

Dropbox.prototype.getParameter = function(res, key) {
  if (_.isString(res) && _.isString(key)) {
    var param = OAuth.decodeForm(res);

    if (_.isArray(param)) {
      return OAuth.getParameter(param, key);
    }
  }

  return null;
};

Dropbox.prototype.getParameterToken = function(res) {
  return this.getParameter(res, OAUTH_TOKEN_KEY);
};

Dropbox.prototype.getParameterTokenSecret = function(res) {
  return this.getParameter(res, OAUTH_TOKEN_SECRET_KEY);
};

Dropbox.prototype.login = function() {
  var message = {
    "method": "POST",
    "action": "https://api.dropbox.com/1/oauth/request_token",
    "parameters": {
      "oauth_consumer_key": OAUTH_CONSUMER_KEY,
      "oauth_signature_method": "HMAC-SHA1"
    }
  };

  var accessor = {
    "consumerSecret": OAUTH_CONSUMER_SECRET
  };

  OAuth.setTimestampAndNonce(message);
  OAuth.SignatureMethod.sign(message, accessor);

  $.post(
    OAuth.addToURL(message.action, message.parameters),
    $.proxy(
      function(res) {
        var token = this.getParameterToken(res);
        var tokenSecret = this.getParameterTokenSecret(res);

        if (!_.isNull(token) && !_.isNull(tokenSecret)) {
          message.action = "https://api.dropbox.com/1/oauth/authorize";
          message.parameters.oauth_token = token;

          accessor.oauth_token_secret = tokenSecret;

          OAuth.setTimestampAndNonce(message);
          OAuth.SignatureMethod.sign(message, accessor);

          this.setToken(token);
          this.setTokenSecret(tokenSecret);

          window.open(OAuth.addToURL(message.action, message.parameters));
        }
      },
      this
    )
  );
};

Dropbox.prototype.sign = function(cb) {
  if (this.isAuthorized()) {
    return;
  }

  var message = {
    "method": "POST",
    "action": "https://api.dropbox.com/1/oauth/access_token",
    "parameters": {
      "oauth_consumer_key": OAUTH_CONSUMER_KEY,
      "oauth_token": this.getToken(),
      "oauth_signature_method": "HMAC-SHA1"
    }
  };

  var accessor = {
    "consumerSecret": OAUTH_CONSUMER_SECRET,
    "tokenSecret": this.getTokenSecret()
  };

  OAuth.setTimestampAndNonce(message);
  OAuth.SignatureMethod.sign(message, accessor);

  $.post(
    OAuth.addToURL(message.action, message.parameters),
    $.proxy(
      function(res) {
        var token = this.getParameterToken(res);
        var tokenSecret = this.getParameterTokenSecret(res);

        if (!_.isNull(token) && !_.isNull(tokenSecret)) {
          this.setToken(token);
          this.setTokenSecret(tokenSecret);
          this.setAuthorized();

          if (_.isFunction(cb)) {
            cb();
          }
        }
      },
      this
    )
  );
};

Dropbox.prototype.getThumbnails = function(cb) {
  var message = {
    "method": "GET",
    "action": "https://api.dropbox.com/1/metadata/sandbox/",
    "parameters": {
      "oauth_consumer_key": OAUTH_CONSUMER_KEY,
      "oauth_token": this.getToken(),
      "oauth_signature_method": "HMAC-SHA1"
    }
  };

  var accessor = {
    "consumerSecret": OAUTH_CONSUMER_SECRET,
    "tokenSecret": this.getTokenSecret()
  };

  OAuth.setTimestampAndNonce(message);
  OAuth.SignatureMethod.sign(message, accessor);

  $.getJSON(
    OAuth.addToURL(message.action, message.parameters),
    $.proxy(
      function(res) {
        res.contents.forEach(function(content) {
          if (content.is_dir || !_.has(content, "mime_type") || !/^image/.test(content.mime_type)) {
            return;
          }

          message.action = "https://api-content.dropbox.com/1/thumbnails/sandbox" + content.path;
          message.parameters.size = "large";

          OAuth.setTimestampAndNonce(message);
          OAuth.SignatureMethod.sign(message, accessor);

          var url = OAuth.addToURL(message.action, message.parameters);

          var xhr = new XMLHttpRequest();
          xhr.open("GET", url, true);
          xhr.responseType = "arraybuffer";
          xhr.onload = function() {
            if (this.response instanceof ArrayBuffer) {
              if (_.isFunction(cb)) {
                cb(this.response);
              }
            }
          };
          xhr.send(null);
        });
      },
      this
    )
  );
};
