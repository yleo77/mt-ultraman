var path = require('path');
var util = require('util');

var colors = require('colors');
var Gaze = require('gaze').Gaze;

var helper = require('../lib/helper.js');
var uploader = require('../lib/uploader.js').uploader;

module.exports = function(grunt) {
  
  helper.runnify(grunt);
  grunt.registerTask('watchy', 'watch files', function(project) {

    var done = this.async();
    var config = helper.projectify(project, undefined, grunt);

    project = config.project;

    // 为其他任务队列留的接口.
    var tasks = this.options().tasks;
    tasks = tasks.map(function(task) {
      if (task.split(':').length === 1) {
        task = task + ':' + project + '::__file__';
      } else {
        task.replace('__project__', project);
      }
      return task;
    });

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
      grunt.log.errorlns('监听出现异常，程序退出，请检查配置');
      done(false);
    });

    gaze.on('ready', function(watcher) {
      helper.log('                   监听准备就绪 ' + ('✔ ').green);
      helper.log();
      // console.log(watcher.watched())
    });
    gaze.on('all', function(event, filepath) {

      if (event === 'deleted') {
        return;
      }

      var ret = grunt.file.isMatch(pattern, filepath);
      if (!ret) {
        return;
      }

      var options = {
        args: tasks.slice(0).map(function(task) {
          return task
            .replace('__file__', path.relative(config.path, filepath));
        })
      };

      grunt.task.runImmediately(options).then(function(res) {
        // console.log(res);
      }, function(err) {
        grunt.log.errorlns('wachy: 任务执行异常, 自动上传失败, 请检查');
      });
    });
  });
};
