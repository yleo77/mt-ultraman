var path = require('path');

var fetch = require('../lib/fetch.js');
var helper = require('../lib/helper.js');

var build_dir;
var cdn_path;

module.exports = function(grunt) {

  grunt.registerTask('increment', 'create incremental file', function(project) {

    var config = helper.projectify(project, undefined, grunt);
    project = config.project;
    build_dir = config.build_dir;
    cdn_path = config.cdn_root;

    var done = this.async();

    var index = 0;
    var completing = 0;
    var failed = 0;
    var err_reason = '';

    grunt.log.writeln();
    grunt.log.writeln('开始生成增量文件... ');
    grunt.log.writeln();

    var newfiles = [];

    grunt.file.recurse(build_dir, function(abspath, rootdir, subdir, filename) {

      if (/(\.css|-\d{3}_\d{3}\.js)$/.test(filename)) {
        return true;
      };
      var o = getIncData(abspath);

      if (!o) {
        newfiles.push(abspath);
        // grunt.log.oklns(abspath + ' 无版本号,或版本号为001, 无需生成增量文件');
        return true;
      }

      index = index + 1;

      fetch(o, function(incRt) {

        completing = completing + 1;

        if (incRt.indexOf('success') < 0) {
          failed = failed + 1;
          err_reason = incRt;
        }

        helper.log(helper.pretty(abspath), (incRt.indexOf('success') < 0) ? 'warn' : 'success');

        check({
          failed: failed,
          err_reason: err_reason
        });
      });
    });

    check();

    function check(o) {
      if (index !== completing) {
        return;
      }

      helper.log('\n以下文件无版本号或版本号为001，无需生成增量文件\n');
      helper.log('  ' + newfiles.join('\n  '))

      if (o) {
        failed = o.failed || 0;
        err_reason = o.err_reason || '';
        if (failed > 0) {
          console.log()
          helper.log(['Warning: ',
            '共 `',
            failed,
            '` 个文件增量文件生成失败，失败原因: ',
            err_reason.indexOf('404') > 0 ? '线上无文件旧版本' : '原因不明',
            '(该信息经确认后可忽略)'
          ].join(''), 'warn');
        }
      }
      done(true);
    }
  });
};

function getIncData(target) {

  var matched = /-(\d{3})\.js/.exec(target);
  if (!matched) {
    return false;
  }
  var curr_version = matched[1];
  var prev_version;

  if (!curr_version || curr_version == '001') {
    return false;
  }

  prev_version = helper.format(curr_version - 1);

  var ret = {
    newfile: target,
    oldfile: target
      .replace(build_dir, cdn_path)
      .replace(curr_version, prev_version),
    incfile: (path.dirname(target)) + "/" + (path.basename(target)).replace(curr_version, prev_version + "_" + curr_version)
  };
  return ret;
}

