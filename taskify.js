/* ~taskify~
 * 
 * Simple Atomic Task Definition for Node and the Browser
 * 
 * -meta---
 * version:    0.3.9
 * builddate:  2012-12-28T03:10:48.288Z
 * generator:  interleave@0.5.24
 * 
 * 
 * 
 */ 

// umdjs returnExports pattern: https://github.com/umdjs/umd/blob/master/returnExports.js
(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory(require('async'), require('underscore'), require('eve'));
    } else if (typeof define === 'function' && define.amd) {
        define(['async', 'underscore', 'eve'], factory);
    } else {
        root['taskify'] = factory(root['async'], root['underscore'], root['eve']);
    }
}(this, function (async, _, eve) {
    
    // define the task registry
    var registry = {},
        taskCounter = 1,
        _defaults = {};
    
    /**
    # TaskDefinition
    */
    function TaskDefinition(name, opts) {
        // ensure we have opts
        opts = opts || {};
    
        // initialise the task name
        this.name = name;
    
        // initialise as not async
        this.isAsync = false;
    
        // initailise the dependencies to be an empty array
        this._deps = _.uniq([].concat(opts.deps || []).concat(_defaults.deps || []));
    
        // allow a fallback task to be specified
        this._fallback = opts.fallback || _defaults.fallback;
    }
    
    TaskDefinition.prototype = {
        /**
        ## depends(names)
        */
        depends: function(names) {
            var ownDep;
    
            // add some dependencies
            this._deps = this._deps.concat(names || []).concat(Array.prototype.slice.call(arguments, 1));
    
            // remove any dependencies for this module name
            while ((ownDep = this._deps.indexOf(this.name)) >= 0) {
                this._deps.splice(ownDep, 1);
            }
    
            // chaining goodness
            return this;
        }
    };
    var proxyCounter = 1;
    
    /**
    # TaskProxy
    
    The TaskProxy provides access to the TaskDefinition information but provides state
    isolation during task execution. 
    */
    function TaskProxy(def, context, execArgs) {
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
    
    TaskProxy.prototype = {
        /**
        ## specify that the task should execute asynchronously
        */
        async: function() {
            // flag as async
            this.isAsync = true;
    
            // return the function to call 
            return this.complete.bind(this);
        },
    
        /**
        ## complete
        */
        complete: function(err) {
            var task = this,
                args = Array.prototype.slice.call(arguments),
                taskResult = args.length > 2 ? args.slice(1) : args[1],
                fallbackDef = taskify.get(this.fallback),
                fallbackProxy;
    
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
        }
    };
    
    /**
    ## @id
    
    The id property is used to return the unique id for the task proxy.  The id is the initially generated
    combined prefixed with the definition name.  For instance if the TaskDefinition name is `test` and the
    `_id` generated for the proxy is 1, then the `id` property will return `test.1`
    */
    Object.defineProperty(TaskProxy.prototype, 'id', {
        get: function() {
            return this.def.name + '.' + this._id;
        }
    });
    
    /**
    ## @fallback
    
    Return the fallback task specified in the task definition
    */
    Object.defineProperty(TaskProxy.prototype, 'fallback', {
        get: function() {
            return this.def._fallback;
        }
    });
    
    /**
    ## @name
    
    The name property is used to proxy the definition name to the proxy
    */
    Object.defineProperty(TaskProxy.prototype, 'name', {
        get: function() {
            return this.def.name;
        }
    });
    
    /**
    ## @promise
    
    The promise property allows tasks to operate seamlessly within a promises
    implementation.  At this stage taskify looks to use `Q` by default, but can 
    also work with other promise implementations that implement a 
    `<packagename>.defer()` function as a way of creating a new Deferred instance (such
    as [when.js](https://github.com/cujojs/when)).
    
    To update taskify to use a library other than the default of `Q` simply update the
    taskify defaults::
    
        taskify.defaults({
            promiseLib: 'when'
        });
    */
    Object.defineProperty(TaskProxy.prototype, 'promise', {
        get: function() {
            var proxy = this, deferred;
    
            // memoize
            if (this._deferred) return this._deferred.promise;
    
            // create the deferred object that we will resolve or reject 
            // based on task completion
            deferred = this._deferred = require(_defaults.promiseLib || 'q').defer();
    
            // handle the complete event
            this.once('complete', function(err) {
                // reset the deferred member of the proxy
                proxy._deferred = undefined;
    
                // if we have an error reject the promise
                if (err) return deferred.reject(err);
    
                // otherwise resolve the promise
                deferred.resolve.apply(deferred, Array.prototype.slice.call(arguments, 1));
            });
    
            return deferred.promise;
        }
    });
    
    ['on', 'once'].forEach(function(bindingName) {
        TaskProxy.prototype[bindingName] = function(eventName, handler) {
            eve[bindingName]('taskify.' + eventName + '.' + this.id, handler);
        };
    });
    /**
    # ExecutionContext
    */
    function ExecutionContext(registry) {
        // save the registry copy for local reference
        this.registry = registry  || {};
    
        // initialise the completed result container
        this.results = {};
    
        // create the errors array
        this.errors = [];
    }
    
    /**
    ## exec(task, atgs)
    
    Execute the specified task passing the args to the runner
    */
    ExecutionContext.prototype.exec = function(target, args) {
        var context = this,
            task, lastTask, proxy;
    
        // get the task from the registry (if not a task itself)
        if (typeof target == 'string' || (target instanceof String)) {
            task = this.registry[target];
        }
        else if (target instanceof TaskDefinition) {
            task = target;
        }
    
        // if the task is not found, then return an error
        if (! task) return new Error('Task "' + target + '" not found');
    
        // create a task proxy
        proxy = new TaskProxy(task, this, args);
    
        // run the dependent tasks
        async.forEach(
            // determine the actual deps (i.e. those task deps that have not already been run)
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
                var runnerResult,
                    runnerErr = null;
    
                if (err) return proxy.complete(err);
    
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
    
    function taskify(name, opts, runner) {
        var task, baseRunner;
    
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
        task = registry[name] = new TaskDefinition(name, opts);
    
        // bind the exec function to the runner instance
        task.runner = runner;
    
        // return the task instance
        return task;
    }
    
    /**
    ## taskify.defaults
    
    Update the defaults for taskify
    */
    taskify.defaults = function(opts) {
        _defaults = _.clone(opts);
    };
    
    /**
    ## taskify.get
    
    Get a task by name
    */
    taskify.get = function(taskName) {
        return registry[taskName];
    };
    
    /**
    ## taskify.select
    
    Prepare task(s) to execute, returning a function that will accept arguments
    that will be passed through to the tasks
    */
    taskify.select = function(target) {
        var initArgs = Array.prototype.slice.call(arguments, 1),
            deps, tmpTask;
    
        // create a temporary task definition with deps on the specified target(s)
        // TODO: generate a UUID for the task
        tmpTask = new TaskDefinition('ghost' + taskCounter, { deps: [].concat(target || [])});
    
        // increment the task counter
        taskCounter += 1;
    
        return function() {
            // create the new execution context
            var context = new ExecutionContext(_.clone(registry)),
                args = initArgs.concat(Array.prototype.slice.call(arguments));
    
            // execute the task with the specified args
            return context.exec(tmpTask, args);
        };
    };
    
    /**
    ## taskify.reset
    
    Reset the registry - clear existing task definitions.
    */
    taskify.reset = function() {
        // reset the registry
        registry = {};
    };
    
    /**
    ## taskify.run
    */
    taskify.run = function(target) {
        return taskify.select(target).apply(null, Array.prototype.slice.call(arguments, 1));
    };
    
    return typeof taskify != 'undefined' ? taskify : undefined;
}));