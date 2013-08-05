/* jshint node: true */
'use strict';

var registry = {};

exports.get = function(taskName) {
  return registry[taskName];
};

exports.put = function(taskName, definition) {
  return registry[taskName] = definition;
};

exports.reset = function() {
  registry = {};
};