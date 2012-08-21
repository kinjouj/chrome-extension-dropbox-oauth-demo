(function(undefined) {
  var URL = window.URL || window.webkitURL;
  var BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder;

  var root = $("body");

  var dropbox = new Dropbox();

  if (dropbox.isAuthorized()) {
    dropbox.getThumbnails(function(binaryData) {
      var bb = new BlobBuilder();
      bb.append(binaryData);

      var canvas = document.createElement("canvas");
      var context = canvas.getContext("2d");

      var img = new Image();
      img.src = URL.createObjectURL(bb.getBlob());
      img.onload = function() {
        context.canvas.width = img.width;
        context.canvas.height = img.height;
        context.drawImage(img, 0, 0);

        URL.revokeObjectURL(this.src);
      };

      $(root).append($("<div>").css("margin", "15px").append($(canvas)));
    });
  } else {
    dropbox.login();
  }
})();
