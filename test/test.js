var fs = require('fs');
var path = require('path');
var makepot = require('../lib/makepot.js');

exports["Test"] = function(test) {
  var dir = path.resolve(__dirname, 'fixture');
  makepot({ verbose: false, dir: dir }, function(error, result) {
    if (error) {
      test.ok(false, error.message);
    }
    else {
      //TODO: Expected test results
    }
    test.done();
  });
};
