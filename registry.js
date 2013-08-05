/* jshint node: true */
'use strict';

var registry = {};

/**
  ### registry.get(name)

**/
exports.get = function(taskName) {
  return registry[taskName];
};

/**
  ### registry.missing(name)

  Return whether or not the task is missing from the registry
**/
exports.missing = function(name) {
  return typeof registry[name] == 'undefined';
}

/**
  ### registry.put(name, definition)

**/
exports.put = function(taskName, definition) {
  return registry[taskName] = definition;
};

/**
  ### registry.reset()

**/
exports.reset = function() {
  registry = {};

  return Object.keys(registry).length === 0;
};