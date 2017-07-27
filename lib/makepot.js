var fs = require('fs');
var path = require('path');

//Default configuration
var config = {
  force: false,
  verbose: process.env.NODE_VERBOSE == "true" || process.env.NODE_VERBOSE == "1",
  source: undefined,
  target: undefined
};

/** Search for files in a directory, recursively **/
function walk(dir, done) {
  var results = [ ];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    var i = 0;
    (function next() {
      var file = list[i++];
      if (!file) return done(null, results);
      file = path.join(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            next();
          });
        }
        else {
          results.push(file);
          next();
        }
      });
    })();
  });
}

/** PHP localization function arguments **/
var rules = {
  '_': [ 'string' ],
  '__': [ 'string' ],
  '_e': [ 'string' ],
  '_c': [ 'string' ],
  '_n': [ 'singular', 'plural' ],
  '_n_noop': [ 'singular', 'plural' ],
  '_nc': [ 'singular', 'plural' ],
  '__ngettext': [ 'singular', 'plural' ],
  '__ngettext_noop': [ 'singular', 'plural' ],
  '_x': [ 'string', 'context' ],
  '_ex': [ 'string', 'context' ],
  '_nx': [ 'singular', 'plural', null, 'context' ],
  '_nx_noop': [ 'singular', 'plural', 'context' ],
  '_n_js': [ 'singular', 'plural' ],
  '_nx_js': [ 'singular', 'plural', 'context' ],
  'esc_attr__': [ 'string' ],
  'esc_html__': [ 'string' ],
  'esc_attr_e': [ 'string' ],
  'esc_html_e': [ 'string' ],
  'esc_attr_x': [ 'string', 'context' ],
  'esc_html_x': [ 'string', 'context' ],
  'comments_number_link': [ 'string', 'singular', 'plural' ],
};

/** Extracts localized string from a .php content **/
function extract(php) {
  var result = [ ];
  
  //For each rule
  var keys = Object.keys(rules);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    
    //Build regular expression
    var re = key;
    re += '\\(';
    var alength = rules[key].length;
    //var quoted = '([\'"]?.*?[\'"]?)';
    //var quoted = '("(?:[^"\\]|\\.)*"|\'(?:[^\'\\]|\\.)*\')';
    var quoted = '("([^"\\\\]*(\\\\.[^"\\\\]*)*)"|\'([^\'\\\\]*(\\\\.[^\'\\\\]*)*)\')';
    for (var a = 0; a < alength; a++) {
      re += quoted;
      re += '\\s*,\\s*';
    }
    re += '([\'"]?.*?[\'"]?)' + '\\)';
    
    //For each match in the php
    var match;
    var regex = new RegExp(re, 'g');
    while (match = regex.exec(php)) {
      if (match.index === regex.lastIndex) {
        regex.lastIndex++;
      }
      
      if (config.verbose == 2) {
        console.log(match[0]);
      }
      
      //Collect the arguments
      var args = [ ];
      for (var a = 0; a < alength; a++) {
        var s = (match[5 * a + 2] || match[5 * a + 4]); //Double quoted or single quoted
        args.push(s);
      }
      
      //Last matched argument
      name = match[match.length - 1].trim();
      if (name.indexOf("'") == 0 || name.indexOf('"') == 0) {
        name = name.substr(1, name.length - 2);
      }
      
      //Find line number
      var index = php.indexOf(match[0]);
      var lineNumber = php.substring(0, index).split('\n').length;
      
      //Build a data object
      var record = {
        func: key,
        name: name,
        args: args,
        match: match[0],
        line: lineNumber,
      };
      
      result.push(record);
    }
  }
  
  return result;
}

/** Converts data to .pot string **/
function convert(data) {
  var pot = '';
  function append(s) { pot += s + '\n'; }
  
  //Metadata
  append('msgid ""');
  append('msgstr ""');
  append('"Language: en\\n"');
  append('"Content-Type: text/plain; charset=UTF-8\\n"');
  append('"Content-Transfer-Encoding: 8bit\\n"');
  append('"X-Generator: makepot.js ' + require('../package.json').version + '\\n"');
  
  var included = { };
  for (var i = 0; i < data.length; i++) {
    var item = data[i];
    var s = item.args[0] || "";
    s = s.replace(/"/g, '\\"');
    
    //Avoid duplicates
    if (included[s]) {
      continue;
    }
    
    //Build .pot string
    append('');
    if (item.file) {
      append('#: ' + item.file + (item.line ? ':' + item.line : ''));
    }
    append('msgid "' + s + '"');
    append('msgstr ""');
    
    included[s] = true;
  }
  
  return pot;
}

/** Find and group by name **/
function group(list) {
  var result = { };
  for (var i = 0; i < list.length; i++) {
    for (var d = 0; d < list[i].data.length; d++) {
      var item = list[i].data[d];
      if (!item.name) {
        item.name = "unknown";
      }
      if (!result[item.name]) {
        result[item.name] = [ ];
      }
      item.file = list[i].file;
      result[item.name].push(item);
    }
  }
  return result;
}

/** Creates a .pot string from .php files in the directory and its subdirectories **/
function makepot(options, callback) {
  var dir = options.dir;
  if (options.verbose) {
    config.verbose = options.verbose;  
  }
  var list = [ ];
  walk(dir, function(error, files) {
    try {
      if (error) throw error;
      
      for (var i = 0; i < files.length; i++) {
        if (path.extname(files[i]) == ".php") {
          var php = fs.readFileSync(files[i], 'utf-8');
          var data = extract(php);
          if (config.verbose) {
            console.log("Found " + data.length + " hits in " + files[i]);
          }
          var result = {
            hits: data.length,
            file: files[i],
            data: data
          };
          if (result.hits > 0) {
            list.push(result);
          }
        }
      }
      
      var result = {
        data: list,
        pot: [ ]
      };
      
      var g = group(list);
      var keys = Object.keys(g);
      for (var i = 0; i < keys.length; i++) {
        var pot = convert(g[keys[i]]);
        result.pot.push({
          name: keys[i],
          content: pot
        });
      }
      
      if (typeof callback == "function") {
        callback(null, result);
      }
    }
    catch (e) {
      if (config.verbose) {
        console.error(e);
      }
      
      if (typeof callback == "function") {
        callback(e);
      }
    }
  });
}

//Required as a module
module.exports = makepot;