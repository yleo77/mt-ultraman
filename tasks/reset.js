var path = require('path');
var fs = require('fs');
var helper = require('../lib/helper.js');
var colors = require('colors');

module.exports = function(grunt) {

  grunt.registerTask('reset', 'remove release files', function(project, type) {
    var config = helper.projectify(project, type, grunt);
    var build_dir = config.build_dir;
    project = config.project;

    if (/stylesheet|css/.test(type)) {
      build_dir = build_dir + 'css/';
    } else if (/javascript|js/.test(type)) {
      build_dir = build_dir + 'js/';
    } else { //
      build_dir = build_dir;
    }

    grunt.file.delete(build_dir);
    grunt.log.writeln();
    grunt.log.writeln('重置项目 ' + (project).green + ' 中');
    grunt.log.oklns(build_dir + ' 文件夹下内容已被清空...');
    grunt.file.mkdir(build_dir);
  });
};
