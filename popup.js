(function(undefined) {
  var root = $("body");

  var dropbox = new Dropbox();
  dropbox.getThumbnails(function(binaryData) {
    var bb = new WebKitBlobBuilder();
    bb.append(binaryData);

    var canvas = document.createElement("canvas");
    var context = canvas.getContext("2d");

    var img = new Image();
    img.src = webkitURL.createObjectURL(bb.getBlob());
    img.onload = function() {
      context.canvas.width = img.width;
      context.canvas.height = img.height;
      context.drawImage(img, 0, 0);

      webkitURL.revokeObjectURL(this.src);
    };

    $(root).append($("<div>").css("margin", "15px").append($(canvas)));
  });
})();
