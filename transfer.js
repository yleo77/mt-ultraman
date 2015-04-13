var path = require('path');
var fs = require('fs');
var util = require('util');

var UglifyJS = require("uglify-js");
var CleanCSS = require('clean-css');

var helper = require('./lib/helper.js');
var jsMap;
var build_dir;

CleanCSS.prototype._oldminify = CleanCSS.prototype.minify;
CleanCSS.prototype.minify = function(source) {
  if (typeof source === 'string') {
    return this._oldminify(fs.readFileSync(source));
  } else if (Array.isArray(source)) {
    return this._oldminify(source.map(function(item) {
      return fs.readFileSync(item);
    }))
  } else {
    throw new Error('传入参数有误，请检查');
  }
}

CleanCSS = new CleanCSS();

var TASK_STATUS = {
  'pending': 0,
  'fail': 1,
  'success': 2
};

module.exports = function(grunt) {

  grunt.registerTask('transfer', 'uglify, concat and create new file with version', function(project, type) {

    var config = helper.projectify(project, type, grunt);
    project = config.project;
    type = config.type;
    build_dir = config.build_dir;

    grunt.log.writeln();
    grunt.log.writeln('源文件目录: ' + (config.path).green.underline );

    var done = this.async();

    // js 时才需要
    if(type != 'css'){
      var version_map = path.normalize(config.path + config.version_map);
      
      if(!fs.existsSync(version_map)) {
        jsMap = null;
      }  else {
        var fileConfig = helper.getFileConfig(version_map);
        jsMap = fileConfig.jsmap;
      }
    }

    var ret = null;
    if (type === 'all') {
      ret = [];
      ret.push(transfer(config, 'js'));
      ret.push(transfer(config, 'css'))
      ret = (ret[0] === TASK_STATUS.success &&
        ret[1] === TASK_STATUS.success) ?
        TASK_STATUS.success :
        TASK_STATUS.fail;
    } else {
      ret = transfer(config);
    }

    if (ret === TASK_STATUS.fail) {
      done(false);
    } else if (ret === TASK_STATUS.success) {
      done(true);
    }
  });

  function transfer(config, type) {

    type = type || config.type;
    grunt.log.writeln();
    grunt.log.writeln('开始合并压缩 ' + (type).green + ' 文件');

    if(type == 'js' && !jsMap){
      grunt.log.writeln();
      grunt.log.writeln( 'Warning'.yellow + ': 未找到js版本信息. 压缩文件将不添加版本信息' );
    }

    grunt.log.writeln();

    var build_target = config[type];
    if (!build_target) {
      grunt.log.error('获取文件配置对象失败, 请检查配置');
      return TASK_STATUS.fail;
    }

    var set = build_target.files;

    // 如果还配置了 src 数组，需要把在 files 中配置过的文件都过滤掉
    // 如果没配置，直接退出就好了
    var src = build_target.src || [];
    var def_src_len = src.length;

    if (set && Object.keys(set).length) {

      for (var target in set) {

        if (!set.hasOwnProperty(target)) {
          continue;
        }

        var files = set [target];

        target = build_dir + target;

        if (!files.length) {
          grunt.log.warn(target + ' 配置项 ' + ('files').yellow + '为空');
          continue;
        }

        if (def_src_len) {
          src = src.concat(files);
        }

        files = files.map(function(item) {
          return config.path + item;
        });

        target = resolve(target, type);
        grunt.file.write(target, minify(files, type));
        helper.log(helper.pretty(target), 'success');
      }
    }

    if (!def_src_len) {
      return TASK_STATUS.success;
    }

    src = src.map(function(item, index) {
      if(index < def_src_len){
        return config.path + item;
      } else {
        return '!' + config.path + item;
      }
    });
    var remain = grunt.file.expand(src);
    if (!remain.length) {
      return TASK_STATUS.success;
    }

    remain.forEach(function(item) {

      var target = resolve(item, type, true);
      target = build_dir + target.replace(new RegExp(config.path), '');
      grunt.file.write(target, minify(item, type));
      helper.log(helper.pretty(target), 'success');
    });

    return TASK_STATUS.success;
  }

  function minify(source, type) {
    var ret = (type === 'js') ?
      UglifyJS.minify(source).code :
      CleanCSS.minify(source);

    return ret;
  }

  function resolve(item, type, without_build_dir) {

    item = item.replace(/<%=( *)timestamp( *)%>/,
      grunt.template.today("yyyymmddHHMMss"));

    if (true && type === 'js') {
      item = item.replace(/(\.js)$/, getItemFV(item) + '$1');
    }

    return item;
  }
};


function getItemFV(filename) {

  // 无jsmap 无版本信息时不用添加版本号
  if(!jsMap) {return ''; }
  filename = path.basename(filename).replace(/-<%=( *)fv( *)%>/g, '');
  var ret = '001';
  var item;

  for (var i in jsMap) {
    item = path.basename(jsMap[i]);
    if (item.indexOf(filename) != 0) {
      continue;
    }
    item = item.split('?');
    if (item.length > 1) {
      ret = item[1];
    }
    break;
  }

  return '-' + ret;
}
