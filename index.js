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

  Define a task `a`:

  ```js
  taskify('a', function() {
    console.log('a');
  });
  ```

  Then define another task that relies on task `a`:

  ```js
  taskify('b', ['a'], function() {
    console.log('b');
  });
  ```

  Run task b:

  ```js
  taskify.run('b');
  ```

  Which would generate the following output:

  ```
  a
  b
  ```

  ## Asynchronous Behaviour

  Specifying that a task handler behaves asynchronously is very similar to
  the way you would do this in a grunt task:

  ```js
  taskify('c', function() {
    // call the async method of the task (passed to the runner as this)
    var done = this.async();

    // when the task has been completed call done
    // the first argument is reserved for an error (if one occured)
    // and subsequent arguments will be placed on the context.results object
    setTimeout(function() {
      done();
    }, 1000);
  });
  ```

  Or a slightly less contrived example:

  ```js
  taskify('load-data', function() {
    fs.readFile(path.resolve('data.txt'), 'utf8', this.async());
  });
  ```

  ## Capturing Result Data

  When you call the `taskify.run` function, Taskify creates a
  new [ExecutionContext](/context.js) for the task dependency tree that will 
  be executed.  This execution context is not persistent though and only
  lasts until the requested tasks have completed their execution (or you
  capture the reference).

  To capture the results of a task execution you will need to handle the
  complete event for a particular task.  Let's look at the simple example of
  our `load-data` task from before:

  ```js
  taskify.run('load-data').on('complete', function(err) {
    if (err) return;

    console.log('loaded data: '  + this.context.results['load-data']);
  });
  ```

  Additionally, because Taskify uses
  [eve](https://github.com/DmitryBaranovskiy/eve) under the hood for eventing,
  you can implement eve handlers to capture the complete events also:

  ```js
  eve.on('taskify.complete.load-data', function(err) {
    if (err) return;

    console.log('loaded data: '  + this.context.results['load-data']);
  });
  ```

  ## Argument Passing

  When running a task using the `taskify.run` function (or by running the
  bound function returned from a `taskify.select`) call, you can supply
  arguments that will be passed to that task handler **and** all precondition
  tasks.

  As an example, let's pass `console.log` as a task handler:

  ```js
  taskify('log', console.log);
  ```

  And then run the task passing through the message arguments:

  ```js
  taskify.run('log', 'Hi there', { test: true });
  ```

  This would generate the following output:

  ```
  Hi there { test: true }
  ```

**/


/**
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

      // if we have a callback defined then attach it to the complete event 
      // of the proxy
      if (callback) {
        proxy.once('complete', callback);
      }

      return proxy;
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

  **/
  task.run = function(target) {
    return task.prepare(target).apply(
      null,
      [].slice.call(arguments, 1)
    );
  };

  return task;
};