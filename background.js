function registerPopup() {
  chrome.browserAction.setPopup({ "popup": "popup.html" });
  chrome.browserAction.setBadgeText({ "text": String() });
}

(function(undefined) {
  var dropbox = new Dropbox();

  if (dropbox.isAuthorized()) {
    registerPopup();
  } else {
    chrome.browserAction.setBadgeText({ "text": "?" });

    dropbox.login();
  }

  chrome.extension.onRequest.addListener(function(req) {
    if (req.event === "sign") {
      dropbox.sign(function() {
        registerPopup();
      });
    }
  });
})();
