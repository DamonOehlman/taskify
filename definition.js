/* jshint node: true */
'use strict';

var _ = require('underscore');

module.exports = function(defaults) {
  var deps = (defaults || {}).deps || [];

  /**
    ## TaskDefinition
  **/
  function TaskDefinition(name, opts) {
    if (! (this instanceof TaskDefinition)) {
      return new TaskDefinition(name, opts);
    }

    // ensure we have opts
    opts = opts || {};

    // initialise the task name
    this.name = name;

    // initialise as not async
    this.isAsync = false;

    // initailise the dependencies to be an empty array
    this._deps = _.uniq([].concat(opts.deps || []).concat(deps));

    // allow a fallback task to be specified
    this._fallback = opts.fallback || (defaults || {}).fallback;
  }

  /**
    ### depends(names)
  **/
  TaskDefinition.prototype.depends = function(names) {
    var ownDep;

    // add some dependencies
    this._deps = this._deps
      .concat(names || [])
      .concat(Array.prototype.slice.call(arguments, 1));

    // remove any dependencies for this module name
    while ((ownDep = this._deps.indexOf(this.name)) >= 0) {
      this._deps.splice(ownDep, 1);
    }

    // chaining goodness
    return this;
  };

  /**
    ### isValid(missingDeps)

    The valid method looks for the dependencies of the task and attempts to 
    retrieve them from the taskify registry.  If all dependencies are resolved,
    `isValid` will return true, or false if not.

    If the method is provided an array for the missingDeps argument, unresolved
    task names will be pushed onto the array and can be accessed for diagnosis
    of the error.

  **/
  TaskDefinition.prototype.isValid = function() {
    var missing = this.unresolved();

    // if we have no missing deps, check next level down
    if (missing.length === 0) {
      return this._deps.map(registry.get).filter(function(dep) {
        return dep.isValid();
      }).length === this._deps.length;
    }
  };

  /**
    ### unresolved()

    Return the names of any unresolved dependencies
  **/
  TaskDefinition.prototype.unresolved = function(deep) {
    var missing = this._deps.filter(registry.missing);

    if (deep) {
      this._deps.map(registry.get).filter(Boolean).forEach(function(dep) {
        missing = missing.concat(dep.unresolved(true));
      });
    }

    return missing;
  };

  return TaskDefinition;
};