const OAUTH_TOKEN_KEY = "oauth_token";
const OAUTH_TOKEN_SECRET_KEY = "oauth_token_secret";


var Dropbox = function() {};

Dropbox.prototype.getToken = function() {
  return localStorage.getItem(OAUTH_TOKEN_KEY);
};

Dropbox.prototype.setToken = function(token) {
  localStorage.setItem(OAUTH_TOKEN_KEY, token);
};

Dropbox.prototype.getTokenSecret = function() {
  return localStorage.getItem(OAUTH_TOKEN_SECRET_KEY);
};

Dropbox.prototype.setTokenSecret = function(tokenSecret) {
  return localStorage.setItem(OAUTH_TOKEN_SECRET_KEY, tokenSecret);
};

Dropbox.prototype.isAuthorized = function() {
  var authorized = localStorage.getItem("authorized");

  return Boolean(authorized);
};

Dropbox.prototype.getParameterToken = function(res) {
  var param = OAuth.decodeForm(res);

  return OAuth.getParameter(param, OAUTH_TOKEN_KEY);
};

Dropbox.prototype.getParameterTokenSecret = function(res) {
  var param = OAuth.decodeForm(res);

  return OAuth.getParameter(param, OAUTH_TOKEN_SECRET_KEY);
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
        var param = OAuth.decodeForm(res);

        var token = OAuth.getParameter(param, OAUTH_TOKEN_KEY);
        var tokenSecret = OAuth.getParameter(param, OAUTH_TOKEN_SECRET_KEY);

        message.action = "https://api.dropbox.com/1/oauth/authorize";
        message.parameters.oauth_token = token;

        accessor.oauth_token_secret = tokenSecret;

        OAuth.setTimestampAndNonce(message);
        OAuth.SignatureMethod.sign(message, accessor);

        this.setToken(token);
        this.setTokenSecret(tokenSecret);

        window.open(OAuth.addToURL(message.action, message.parameters));
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
        this.setToken(this.getParameterToken(res));
        this.setTokenSecret(this.getParameterTokenSecret(res));

        localStorage.setItem("authorized", true);

        cb();
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
          if (!content.is_dir) {
            message.action = "https://api-content.dropbox.com/1/thumbnails/sandbox" + content.path;
            message.parameters.size = "large";

            OAuth.setTimestampAndNonce(message);
            OAuth.SignatureMethod.sign(message, accessor);

            var xhr = new XMLHttpRequest();
            xhr.open("GET", OAuth.addToURL(message.action, message.parameters));
            xhr.responseType = "arraybuffer";
            xhr.onload = function() {
              cb(this.response);
            };
            xhr.send(null);
          }
        });
      },
      this
    )
  );
};
