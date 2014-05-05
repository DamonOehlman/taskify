/* jshint node: true */
'use strict';

var FastMap = require('collections/fast-map');

/**
  # Taskify

  This is a simple task execution helper that is heavily influenced from
  [jake](https://github.com/mde/jake) and
  [grunt](https://github.com/gruntjs/grunt).  It's kind of like jake but
  without the build goodies, and designed to work in the browser as well
  as node.

  ## Example Usage

  <<< docs/example-usage.md

  ## Asynchronous Behaviour

  <<< docs/async.md

  ## Capturing Result Data

  <<< docs/result-data.md

  ## Argument Passing

  <<< docs/argument-passing.md

  ## Taskify Reference

**/
module.exports = function(opts) {
  // create the object hash for the registry, allow provision of an existing
  // object that can be used in the registry in the case we want to unify
  // tasks
  var registry = (opts || {}).registry || new FastMap();

  // create the task definition constructor
  var TaskDefinition = require('./definition')(registry, opts);

  // define the ExecutionContext constructor
  var ExecutionContext = require('./context')(registry, TaskDefinition, opts);

  // initialise the task counter
  var taskCounter = 1;

  // should we attempt to pop callbacks?
  var popCallbacks = (opts || {}).popCallbacks;

  /**

    ### task(name, opts, runner)

    Register a new task with the taskify registry.

  **/
  function task(name, opts, runner) {
    var task;

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
    registry.set(name, task = new TaskDefinition(name, opts));

    // bind the exec function to the runner instance
    task.runner = runner;

    // return the task instance
    return task;
  }

  /**

    ### task.get(name)

    Retrieve a task from the registry.
  **/
  task.get = registry.get.bind(registry);


  /**
    ### task.prepare

    Prepare task(s) to execute, returning a function that will accept
    arguments that will be passed through to the tasks
  **/
  task.prepare = function(target) {
    var initArgs = Array.prototype.slice.call(arguments, 1);
    var deps = [].concat(target || []);

    // create a temporary task definition with deps on the specified target(s)
    // TODO: generate a UUID for the task
    var tmpTask = new TaskDefinition('ghost' + taskCounter, { deps: deps });

    // increment the task counter
    taskCounter += 1;

    return function() {
      var args = initArgs.concat(Array.prototype.slice.call(arguments));

      // execute the task with the specified args
      return new ExecutionContext().exec(tmpTask, args);
    };
  };

  /**
    ### task.select

    The select function passes control through to the `taskify.prepare`
    function, but only once it has validated that task dependencies have been
    satisfied.  If dependencies cannot be satisfied then an Error will
    be thrown.

  **/
  task.select = function(target) {
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

    return task.prepare.apply(this, arguments);
  };

  /**
    ### task.run(target, args*)

    Run the specified task, with the provided arguments.

    alias: `task.spawn`

  **/
  task.run = task.spawn = function(target) {
    return task.prepare(target).apply(
      null,
      [].slice.call(arguments, 1)
    );
  };

  /**
    ### task.exec(args, callback)

    Using the args specified, run a task and execute the callback once the task
    has completed. The task name is passed in `args[0]` with `args.slice(1)`
    containing any parameters that should be passed to the task when it is
    run.

    The `task.exec` function has been optimized for use with a
    [pull-stream](https://github.com/dominictarr/pull-stream) sink.

  **/
  task.exec = function(args, callback) {
    // extract the task name
    var name = args.splice(0)[0];

    // prepare the task
    var t = task.get(name);
    var proxy;

    // if we have no task, defined, then report an error
    if (! t) {
      return callback(new Error('could not find task: ' + name));
    }

    // create the execution context
    proxy = new ExecutionContext().exec(t, args);
    proxy.once('complete', callback);
  };

  return task;
};
