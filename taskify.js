/* ~taskify~
 * 
 * Simple Atomic Task Definition for Node and the Browser
 * 
 * -meta---
 * version:    0.2.3
 * builddate:  2012-10-31T13:27:47.909Z
 * generator:  interleave@0.5.23
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
        taskCounter = 1;
    
    /**
    # TaskInstance
    */
    function TaskInstance(name, opts) {
        // ensure we have opts
        opts = opts || {};
    
        // initialise the task name
        this.name = name;
    
        // initialise as not async
        this.isAsync = false;
    
        // initailise the dependencies to be an empty array
        this._deps = [].concat(opts.deps || []);
    }
    
    TaskInstance.prototype = {
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
                taskResult = args.length > 2 ? args.slice(1) : args[1];
    
            // if we have an execution context for the task, then update the results
            // but only if we didn't receive an error
            if (this.name && this.context && (! args[0])) {
                this.context.results[this.name] = taskResult || true;
            }
    
            setTimeout(function() {
                eve.apply(null, ['task.complete.' + task.name, task].concat(args));
    
                // clear the context
                task.context = undefined;
            }, 0);
        },
    
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
    
    ['on', 'once'].forEach(function(bindingName) {
        TaskInstance.prototype[bindingName] = function(eventName, handler) {
            eve[bindingName]('task.' + eventName + '.' + this.name, handler);
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
    }
    
    /**
    ## exec(task, atgs)
    
    Execute the specified task passing the args to the runner
    */
    ExecutionContext.prototype.exec = function(target, args) {
        var context = this,
            task, lastTask;
    
        // get the task from the registry (if not a task itself)
        if (typeof target == 'string' || (target instanceof String)) {
            task = this.registry[target];
        }
        else if (target instanceof TaskInstance) {
            task = target;
        }
    
        // if the task is not found, then return an error
        if (! task) return new Error('Task "' + target + '" not found');
    
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
                    eve.once('task.complete.' + depname, itemCallback);
                }
            },
    
            function(err) {
                var runnerResult;
    
                if (err) return task.complete(err);
    
                // set the execution context for the task
                task.context = context;
    
                // execute the task
                if (typeof task.runner == 'function') {
                    runnerResult = task.runner.apply(task, args);
                }
    
                // if the task is not async, then complete the task
                if (! task.isAsync) {
                    task.complete.apply(task, [null].concat(runnerResult || []));
                }
            }
        );
    
        return task;
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
        task = registry[name] = new TaskInstance(name, opts);
    
        // bind the exec function to the runner instance
        task.runner = runner;
    
        // return the task instance
        return task;
    }
    
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
        var context = new ExecutionContext(_.clone(registry)),
            deps, tmpTask;
    
        // create a temporary task definition with deps on the specified target(s)
        // TODO: generate a UUID for the task
        tmpTask = new TaskInstance(taskCounter, { deps: [].concat(target || [])});
    
        // increment the task counter
        taskCounter += 1;
    
        return function() {
            // execute the task with the specified args
            return context.exec(tmpTask, Array.prototype.slice.call(arguments));
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