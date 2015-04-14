var path = require('path');
var util = require('util');

var colors = require('colors');
var Gaze = require('gaze').Gaze;

var helper = require('../lib/helper.js');
var uploader = require('../lib/uploader.js').uploader;

module.exports = function(grunt) {

  grunt.registerTask('watchy', 'watchi files', function(project, type, env) {

    var done = this.async();
    var config = helper.projectify(project, type, grunt);

    env = env || config.env;
    project = config.project;

    var environment = grunt.config.get('upload').options.environment[env];
    var cdn_root = config.cdn_root.replace(config.path, '');
    var project_root = process.cwd();

    helper.log();
    helper.log('        监听目录:  ' + (config.path).green.underline);
    helper.log();

    var pattern = [
      '!**/node_modules/**',
      '!**/ultraman/**'
    ];
    pattern.unshift(path.resolve(config.path) + '/**/**');

    var gaze = new Gaze(pattern);
    gaze.on('error', function(error) {
      helper.log('监听出现异常，程序退出，请检查配置');
      done(false);
    });

    gaze.on('ready', function(watcher) {
      helper.log('                   监听准备就绪 ' + ('✔ ').green);
      helper.log();
      // console.log(watcher.watched())
    });
    gaze.on('all', function(event, filepath) {

      // console.log(filepath + ' was ' + event);
      if (event === 'deleted') {
        return;
      }

      var ret = grunt.file.isMatch(pattern, filepath);
      if (!ret) {
        return;
      }

      var rel_path = path.relative(project_root, filepath);
      var cdn_path = path.normalize(cdn_root + path.dirname(rel_path) + '/');
      uploader(helper.extend({
        fullpath: rel_path,
        cdn_path: cdn_path,
      }, environment), callback);
    });

    function callback(o) {
      helper.log(helper.pretty(o.fullpath), (o.response.statusCode == 200) ? 'success' : 'fail');
    }
  });
};
