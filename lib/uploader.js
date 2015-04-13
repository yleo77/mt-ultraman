var fs = require('fs');
var http = require('http');
var path = require('path');

var upload = function(config, callback) {

  var fullpath = config.fullpath;
  var filename = path.basename(config.fullpath);
  var cdn_path = config.cdn_path;
  var callback = callback || function() {};
  // debug
  // callback({
  //   fullpath: fullpath,
  //   response: {
  //     statusCode: 200
  //   }
  // });
  // return;
  var datas = fs.readFileSync(fullpath);
  var boundary = "---------------------------leon";
  var formStr = '--' + boundary + '\r\n' + 'Content-Disposition: form-data; name="filePath"' + '\r\n\r\n' + cdn_path + filename + '\r\n' + '--' + boundary + '\r\n' + 'Content-Disposition: form-data; name="content"; filename="' + filename + '"' + '\r\n' + 'Content-Type: application/octet-stream' + '\r\n\r\n';
  var formEnd = '\r\n--' + boundary + '--\r\n';
  var options = {
    host: config.host || "localhost",
    path: config.script || "/upload",
    port: config.port || 80,
    method: "POST",
    headers: {
      "Content-Type": "multipart/form-data; boundary=" + boundary,
      "Content-Length": formStr.length + datas.length + formEnd.length
    }
  };

  var req = http.request(options, function(res) {

    res.on('data', function(data) {
    });

    res.on('end', function() {
      callback && callback({
        fullpath: fullpath,
        response: res
      });
    });
  });
  req.write(formStr);
  req.write(datas);
  req.write(formEnd);
  req.end();
};

exports.uploader = upload;
