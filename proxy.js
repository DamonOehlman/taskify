/* jshint node: true */
'use strict';

var defaults = require('./defaults');
var proxyCounter = 1;
var registry = require('./registry');
var eve = require('eve');

/**
  ## TaskProxy

  The TaskProxy provides access to the TaskDefinition information but
  provides state isolation during task execution. 
*/
function TaskProxy(def, context, execArgs) {
  if (! (this instanceof TaskProxy)) {
    return new TaskProxy(def, context, execArgs);
  }

  // save a reference to the definition
  this.def = def;

  // save a reference to the execution context
  this.context = context;

  // save the exec args
  this.execArgs = execArgs || [];

  // initialize the isAsync flag to false
  this.isAsync = false;

  // initialise the proxy count id
  this._id = proxyCounter++;
}

module.exports = TaskProxy;

/**
  ### async()

  Specify that the task should execute asynchronously
**/
TaskProxy.prototype.async = function() {
  // flag as async
  this.isAsync = true;

  // return the function to call 
  return this.complete.bind(this);
};

/**
  ### complete(err)

**/
TaskProxy.prototype.complete = function(err) {
  var task = this;
  var args = Array.prototype.slice.call(arguments);
  var taskResult = args.length > 2 ? args.slice(1) : args[1];
  var fallbackDef = registry.get(this.fallback);
  var fallbackProxy;

  // if we received an error, then add this to the context error stack
  if (err) {
    // add the task name to the error
    err.task = this;

    // save the error
    this.context.errors.unshift(err);
  }

  // if we hit an error, and we have a callback, then run the fallback
  if (err && fallbackDef) {
    fallbackProxy = this.context.exec(this.fallback, this.execArgs);

    // when the fallback task completes, run the completion event
    fallbackProxy.on('complete', task.complete.bind(task));

    // prevent further execution
    return;
  }

  // if we have an execution context for the task, then update the results
  if (this.name && this.context) {
    this.context.results[this.name] = err ? err : (taskResult || true);
  }

  setTimeout(function() {
    eve.apply(null, ['taskify.complete.' + task.id, task].concat(args));
  }, 0);
};

/**
  ### @id

  The id property is used to return the unique id for the task proxy.  The id
  is the initially generated combined prefixed with the definition name.
  For instance if the TaskDefinition name is `test` and the `_id` generated
  for the proxy is 1, then the `id` property will return `test.1`

**/
Object.defineProperty(TaskProxy.prototype, 'id', {
  get: function() {
    return this.def.name + '.' + this._id;
  }
});

/**
  ### @fallback

  Return the fallback task specified in the task definition
**/
Object.defineProperty(TaskProxy.prototype, 'fallback', {
  get: function() {
    return this.def._fallback;
  }
});

/**
  ### @name

  The name property is used to proxy the definition name to the proxy
**/
Object.defineProperty(TaskProxy.prototype, 'name', {
  get: function() {
    return this.def.name;
  }
});

/**
  ### @promise

  The promise property allows tasks to operate seamlessly within a promises
  implementation.  At this stage taskify looks to use `Q` by default, but can 
  also work with other promise implementations that implement a 
  `<packagename>.defer()` function as a way of creating a new Deferred
  instance (such as [when.js](https://github.com/cujojs/when)).

  To update taskify to use a library other than the default of `Q` simply
  update the taskify defaults::

  ```js
  taskify.defaults({
    promiseLib: 'when'
  });
  ```

**/
Object.defineProperty(TaskProxy.prototype, 'promise', {
  get: function() {
    var proxy = this;
    var deferred;
    var plib = defaults('promiseLib');

    // memoize
    if (this._deferred) {
      return this._deferred.promise;
    }

    // create the deferred object that we will resolve or reject 
    // based on task completion
    deferred = this._deferred = (plib ? plib.defer() : null);

    // handle the complete event
    this.once('complete', function(err) {
      // reset the deferred member of the proxy
      proxy._deferred = undefined;

      // if we have an error reject the promise
      if (err) {
        return deferred.reject(err);
      }

      // otherwise resolve the promise
      deferred.resolve.apply(
        deferred,
        Array.prototype.slice.call(arguments, 1)
      );
    });

    return deferred.promise;
  }
});

['on', 'once'].forEach(function(bindingName) {
  TaskProxy.prototype[bindingName] = function(eventName, handler) {
    eve[bindingName]('taskify.' + eventName + '.' + this.id, handler);
  };
});