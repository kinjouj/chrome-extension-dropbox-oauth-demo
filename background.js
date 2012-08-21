function getDropboxAPI() {
  return new Dropbox();
}

function startLogin() {
  chrome.browserAction.setBadgeText({ "text": "?" });

  var dropbox = getDropboxAPI();
  dropbox.login();
}

function registerPopup() {
  chrome.browserAction.setPopup({ "popup": "popup.html" });
  chrome.browserAction.setBadgeText({ "text": String() });
}

(function(undefined) {
  var dropbox = getDropboxAPI();

  if (dropbox.isAuthorized()) {
    registerPopup();
  } else {
    startLogin();
  }

  chrome.browserAction.onClicked.addListener(function() {
    if (!dropbox.isAuthorized()) {
      startLogin();
    }
  });

  chrome.extension.onRequest.addListener(function(req) {
    if (_.isObject(req)) {
      if (_.has(req, "event") && req.event === "sign") {
        dropbox.sign(function() {
          registerPopup();
        });
      }
    }
  });
})();
