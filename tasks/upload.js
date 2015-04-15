var path = require('path');
var fs = require('fs');
var util = require('util');
var colors = require('colors');
var uploader = require('../lib/uploader.js').uploader;
var helper = require('../lib/helper.js');

var keypress = require('keypress');
keypress(process.stdin);

// 上传模式
var modes = {
  // 1: '自动监听',       // 2015-04-14 自动监听模式修改，不再走这里逻辑
  2: '指定文件(夹)',
  10: '默认上传'
};

// 支持上传的文件类型
var types = {
  'js': /\.(js|json)$/,
  'css': /\.css$/,
  'java': /\.(jsp|xml)$/,
  'img': /\.(jpg|png|gif)$/,

  'html': /\.html$/,
  'all': /.+/
};

module.exports = function(grunt) {

  // project: 项目
  // type: 文件类型， 不传或默认为所有
  // files: 具体的文件或者目录
  // env: 上传环境。
  grunt.registerTask('upload', 'upload files', function(project, type, files, env) {

    if (type && !types[type]) {
      helper.log('  指定文件类型 ' + sfiles + ' 不能被识别, 请再确认', 'fail');
      return;
    }

    var index = 0; // 共需上传文件数
    var completing = 0; // 已经上传成功的
    var done = this.async();
    var oriType = type;

    var config = helper.projectify(project, type, grunt);

    env = env || config.env;
    project = config.project;
    type = config.type;

    var uploadinfo = helper.get_upload_info(config, grunt);
    var cdn_root = uploadinfo.cdn_root;
    var environment = this.options()['environment'][env];

    var sfiles = null; // 需要上传的目标文件(夹)
    var mode = 0;

    if (files) { // 指定文件或目录形式
      sfiles = path.normalize(config.path + files);
      mode = 2;
      type = oriType || 'all'; // 指定文件目录默认为所有文件，除非命令行指名。
    } else { // 默认 Gruntfile.js 中配置的 upload_dir
      sfiles = uploadinfo.upload_dir;
      mode = 10;
    }

    if (!fs.existsSync(sfiles)) {

      helper.log();
      helper.log('  指定文件 ' + sfiles + ' 不存在, 请再确认', 'fail');
      helper.log();
      done(false);

      return;
    }

    helper.log();
    helper.log('        启动模式:  ' + (modes[mode]).green.underline);
    helper.log('    上传目标环境:  ' + env.green.underline);
    helper.log('       CDN根目录:  ' + cdn_root.green.underline);

    helper.log('      源文件目录:  ' + sfiles.green.underline);
    helper.log('        资源类型:  ' + (type).green.underline);
    helper.log();

    var fstat = fs.statSync(sfiles);
    if (fstat.isFile()) {
      index = 1;
      cdn_root = cdn_root.replace(config.path, '');
      uploader(helper.extend({
        fullpath: sfiles,
        cdn_path: cdn_root + path.dirname(sfiles) + '/'
      }, environment), callback);
    } else if (fstat.isDirectory()) {

      if (mode === 2) {
        // 如果是指定文件夹上传，这里需要修改 cdn_root;
        cdn_root = path.normalize(cdn_root + files + '/');
      }
      run(sfiles);
    }


    function run(dir) {

      if (!dir || !fs.existsSync(dir)) {
        helper.log(' 传目录 ' + dir + ' 传递有误, 请再确认', 'fail');
        done(false);
        return;
      }

      // 防止没找到文件任务超时.
      setTimeout(function() {
        if (!index) {
          helper.log('     未找到对应文件, 任务执行结束 ❕');
          done(true);
        }
      }, 300);

      grunt.file.recurse(dir, function(abspath, rootdir, subdir, filename) {
        if (!keepgoing(type, filename)) {
          return true;
        }

        if (!subdir) {
          subdir = '';
        }

        index = index + 1;

        uploader(helper.extend({
          fullpath: abspath,
          cdn_path: path.normalize(cdn_root + subdir + '/')
        }, environment), callback);
      });
    }

    function callback(o) {

      completing++;

      helper.log(helper.pretty(o.fullpath), (o.response.statusCode == 200) ? 'success' : 'fail');
      completing === index && done(true);
    }

    function keepgoing(type, filename) {

      return (type && types[type].test(filename)) ? true : false;
    }
  });
};
