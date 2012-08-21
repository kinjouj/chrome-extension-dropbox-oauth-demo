var referrer = document.referrer;

if (_.isString(referrer)) {
  var matches = referrer.match(/oauth_consumer_key=([^&]+)/);

  if (matches.length > 0) {
    if  (RegExp.$1 === OAUTH_CONSUMER_KEY) {
      chrome.extension.sendRequest({ "event": "sign" });

      window.close();
    }
  }
}
