/* jshint node: true */
'use strict';

var async = require('async');
var registry = require('./registry');
var TaskDefinition = require('./definition');
var TaskProxy = require('./proxy');
var _ = require('underscore');

/**
## ExecutionContext
**/
function ExecutionContext() {
  if (! (this instanceof ExecutionContext)) {
    return new ExecutionContext();
  }

  // initialise the completed result container
  this.results = {};

  // create the errors array
  this.errors = [];
}

module.exports = ExecutionContext;

/**
### exec(task, atgs)

Execute the specified task passing the args to the runner
**/
ExecutionContext.prototype.exec = function(target, args) {
  var context = this;
  var task;
  var proxy;

  // get the task from the registry (if not a task itself)
  if (typeof target == 'string' || (target instanceof String)) {
    task = registry.get(target);
  }
  else if (target instanceof TaskDefinition) {
    task = target;
  }

  // if the task is not found, then return an error
  if (! task) {
    return new Error('Task "' + target + '" not found');
  }

  // create a task proxy
  proxy = new TaskProxy(task, this, args);

  // run the dependent tasks
  async.each(
    // determine the actual deps (i.e. those task deps that have 
    // not already been run)
    _.without(task._deps, Object.keys(this.results)),

    function(depname, itemCallback) {
      // execute the child task
      var childTask = context.exec(depname, args);

      // if we didn't get a child task, then trigger an error
      if (childTask instanceof Error) {
        return itemCallback(childTask);
      }
      else {
        childTask.once('complete', function() {
          itemCallback.apply(this, arguments);
        });
      }
    },

    function(err) {
      var runnerResult;
      var runnerErr = null;

      if (err) {
        return proxy.complete(err);
      }

      // execute the task
      if (typeof task.runner == 'function') {
        runnerResult = task.runner.apply(proxy, args);
      }

      // if the runner result is an error, then use it as the error
      // and undefine the runnerResult
      if (runnerResult instanceof Error) {
        runnerErr = runnerResult;
        runnerResult = undefined;
      }

      // if the task is not async, then complete the task
      if (! proxy.isAsync) {
        proxy.complete.apply(proxy, [runnerErr].concat(runnerResult || []));
      }
    }
  );

  return proxy;
};