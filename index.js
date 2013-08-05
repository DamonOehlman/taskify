/* jshint node: true */
'use strict';

var async = require('async');
var _ = require('underscore');
var eve = require('eve');

// define the task registry
var registry = require('./registry');
var taskCounter = 1;
var defaults = require('./defaults');
var TaskDefinition = require('./definition');
var TaskProxy = require('./proxy');
var ExecutionContext = require('./context');


/**
  # taskify(name, opts, runner)
**/
var taskify = module.exports = function(name, opts, runner) {
  var task;
  var baseRunner;

  // handle the noopts case
  if (typeof opts == 'function') {
    runner = opts;
    opts = {};
  }
  // if the opts is an array, we just have dependencies specified
  else if (Array.isArray(opts)) {
    opts = {
      deps: opts
    };
  }

  // create the task instance
  // and save the new task instance to the registry
  task = registry.put(name, TaskDefinition(name, opts));

  // bind the exec function to the runner instance
  task.runner = runner;

  // return the task instance
  return task;
}

/**
  ## taskify.defaults

  Update the defaults for taskify
**/
taskify.defaults = function(opts) {
  _defaults = _.clone(opts);
};

/**
  ## taskify.get

  Get a task by name
**/
taskify.get = registry.get;

/**
  ## taskify.prepare

  Prepare task(s) to execute, returning a function that will accept arguments
  that will be passed through to the tasks
*/
taskify.prepare = function(target) {
  var initArgs = Array.prototype.slice.call(arguments, 1);
  var deps = [].concat(target || []);

  // create a temporary task definition with deps on the specified target(s)
  // TODO: generate a UUID for the task
  var tmpTask = new TaskDefinition('ghost' + taskCounter, { deps: deps });

  // increment the task counter
  taskCounter += 1;

  return function() {
    var args = initArgs.concat(Array.prototype.slice.call(arguments));
    var callback;
    var proxy;

    // if we have been supplied a function as the last argument
    // then we will assume it is a callback function
    // TODO: investigate making this toggleable with a taskify switch ?
    if (typeof args[args.length - 1] == 'function') {
      callback = args.pop();
    }

    // execute the task with the specified args
    proxy = new ExecutionContext().exec(tmpTask, args);

    // if we have a callback defined then attach it to the complete event of the proxy
    if (callback) { 
      proxy.once('complete', callback);
    }

    return proxy;
  };
};

/**
  ## taskify.select

  The select function passes control through to the `taskify.prepare`
  function, but only once it has validated that task dependencies have been
  satisfied.  If dependencies cannot be satisfied then an Error will
  be thrown.

**/
taskify.select = function(target) {
  var deps = [].concat(target || []);
  var tmpDef = new TaskDefinition('tmp', { deps: deps });
  var missingDeps = [];

  // if we have no dependencies then throw an exception
  if (deps.length === 0) {
    throw new Error('Task names are required to select tasks');
  }

  // if the temporary task is not valid, then also throw an error
  if (! tmpDef.isValid(missingDeps)) {
    var error = new Error('Unable to select task, unresolved dependencies: [' + 
         missingDeps.join(', ') + ']');

    // add the missing dependencies array to the error
    error.missing = [].concat(missingDeps);
    throw error;
  }

  return taskify.prepare.apply(this, arguments);
};

/**
  ## taskify.reset

  Reset the registry - clear existing task definitions.
**/
taskify.reset = registry.reset;

/**
  ## taskify.run
**/
taskify.run = function(target) {
  return taskify.prepare(target).apply(
    null,
    [].slice.call(arguments, 1)
  );
};