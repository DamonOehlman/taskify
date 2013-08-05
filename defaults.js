/* jshint node: true */
'use strict';

var defaults = {};

module.exports = function(name, value) {
  // if we have been passed a string, then either get or set
  // the specified default value
  if (typeof name == 'string' || (name instanceof String)) {
    if (value) {
      return defaults[name] = value;
    }
    else {
      return defaults[name];
    }
  }
  else if (typeof name == 'object') {
    defaults = name;
  }
  else {
    return defaults;
  }
};