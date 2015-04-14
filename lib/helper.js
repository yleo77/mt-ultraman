var fs = require('fs');
var colors = require('colors');

var extend = function(target, source) {
  if (!source) {
    return target;
  }

  for (var key in source) {

    if (typeof source[key] === 'object') {
      target[key] = target[key] || (Array.isArray(source[key]) ? [] : {});
      extend(target[key], source[key]);
    } else {
      source.hasOwnProperty(key) && (target[key] = source[key]);
    }
  }

  return target;
};


exports.extend = extend;

exports.getFileConfig = function(file) {
  var txt = fs.readFileSync(file, {
    encoding: 'utf8'
  });
  var reg = /\<script type\=\"text\/javascript\" id\=\"file_config\"\>([\s\S]+?)\<\/script\>/;
  var result = txt.match(reg);
  var jsCode = result[1];
  eval(jsCode);
  return g_config;
};

exports.format = function(num, len) {

  if (!num) {
    return '001';
  }

  len = Math.max(('' + num).length, len || 3);
  var placeholder = '';
  for (var i = 0; i < len; i++) {
    placeholder += '0';
  }
  return (placeholder + num).substr(-len);
};

exports.projectify = function(project, type, grunt) {

  var o = {};
  // var defaulty = grunt.config('project').defaulty;
  var defaulty = grunt.config('project')[grunt.config('global_project')];
  if (!project) {
    project = grunt.config('current_project');
  }

  o = grunt.config('project')[project];
  o.project = project;
  o.type = type || o.type || defaulty.type;
  o.path = o.path || defaulty.path + o.project + '/';

  // build_dir 配置规则为 全局项目的 build_dir 拼接 项目路径
  o.build_dir = o.build_dir || (defaulty.build_dir + o.path);

  // 环境优先级: 项目优先级 > 全局项目配置默认环境 > 上传任务中定义的环境
  o.env = o.env || defaulty.env || grunt.config('upload.options.env');

  return o;
};


exports.get_upload_info = function(o, grunt) {
  var ret = {};
  var upload_dir_by_user = false;
  var defaulty = grunt.config('project')[grunt.config('global_project')];
  if (o.upload_dir) {
    ret.upload_dir = o.upload_dir;
    upload_dir_by_user = true;
  } else {
    ret.upload_dir = defaulty.upload_dir + o.path;
  }

  if (o.cdn_root) {
    ret.cdn_root = o.cdn_root;
  } else {
    ret.cdn_root = defaulty.cdn_root + o.path;
  }

  return ret;
};

exports.pretty = function(str, maxlength) {

  if (!str) {
    return '';
  }
  maxlength = maxlength || 60;

  var len = str.length;
  var placeholder = '.';
  var gap = new Array(3).join(' ');
  var remain = 0;
  var ret;
  var pos = 5; // 截取策略是从中间截取。
  if (len < maxlength) {
    remain = maxlength - len;
    var tmp = new Array(remain + 1 - 2).join(placeholder);
    ret = str + gap + tmp;
  } else if (maxlength < pos) {
    ret = str.substr(0, maxlength - 2) + gap;
  } else if (len === maxlength) {
    ret = str;
  } else {
    var reg = new RegExp('^[a-z0-9/]{' + (len - maxlength + 2) + '}', 'i');
    ret = str.substr(0, pos) + str.substr(pos).replace(reg, '') + gap;
  }
  return ret;
};

exports.log = function(info, type) {

  var prefix = '';
  var suffix = '';
  switch (type) {
    case 'success':
      prefix = ('>>').green + ' ';
      suffix = ' ' + ('[ ✔ ]').green;
      break;
    case 'fail':
      prefix = ('>>').red + ' ';
      suffix = ' ' + ('[ ✘ ]').red;
      break;
    case 'warn':
      prefix = ('>>').yellow + ' ';
      suffix = ' ' + ('[ ☹ ]').yellow;
      break;
    default:
      break;
  }

  console.log(!info ? '' : (prefix + info + suffix));
};


exports.runnify = function(grunt) {

  grunt.task.runImmediately = function(options) {
    
    var defaulty = {
      grunt: true,
      opts: {
        cwd: process.cwd(),
        stdio: 'inherit'
      }
    };
    options = extend(defaulty, options);

    return new Promise(function(resolve, reject) {
      grunt.util.spawn(options, function(err, res, code) {
        if (code !== 0) {
          reject(err);
          return;
        }
        resolve(res);
      });
    });
  };
};
