var http = require('http');
var incrementify = require('incrementify');
var cdnDomain = 'http://3gimg.qq.com';

function fetch(incData, callback) {
  var oldurl = cdnDomain + '/' + incData.oldfile;
  var message = '';
  var req = http.get(oldurl, function(res) {
    var txt = '';
    res.setEncoding('utf8');
    res.on('data', function(chunk) {
      txt += chunk;
    });
    res.on('end', function() {

      if (txt.indexOf('<title>404 Not Found</title>') !== -1) {
        message = 'file 404'.red;
      } else {

        var ret = incrementify.build(txt, incData.newfile, {
          oldfile_type: 'content',
          output: incData.incfile
        });
        message = ret.signal == 10 ? 'success'.green : 'error'.red;
      }
      callback(message);
    });
  });
  req.on('error', function(err) {
    message = 'error'.red;
    callback(message);
  });
}

module.exports = fetch;
