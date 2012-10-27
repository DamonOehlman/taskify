/*
 * taskify v0.0.00.0.0
 * build   => 2012-10-27T11:54:28.668Z
 * 
 * 
 *  
 */ 

// umdjs returnExports pattern: https://github.com/umdjs/umd/blob/master/returnExports.js
(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory(require('async'), require('underscore'));
    } else if (typeof define === 'function' && define.amd) {
        define(['async', 'underscore'], factory);
    } else {
        root['taskify'] = factory(root['async'], root['underscore']);
    }
}(this, function (async, _) {
    
    // define the task registry
    var registry = {};
    
    /**
    # TaskInstance
    */
    function TaskInstance(name, opts) {
        // ensure we have opts
        opts = opts || {};
    
        // initialise the task name
        this.name = name;
    
        // initailise the dependencies to be an empty array
        this._deps = [].concat(opts.deps || []);
    
        // initialise async to false
        this._completionListeners = null;
    }
    
    TaskInstance.prototype = {
        /**
        ## specify that the task should execute asynchronously
        */
        async: function() {
            var task = this;
    
            // initialise the completion listeners array
            this._completionListeners = [];
    
            // return the function to call 
            return function() {
                var args = arguments;
    
                // fire the completion listeners
                task._completionListeners.forEach(function(listener) {
                    listener.apply(task, args);
                });
            };
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
    /**
    # ExecutionContext
    */
    function ExecutionContext() {
        this.completed = {};
    }
    
    ExecutionContext.prototype = {
        /**
        ## runTask(task, callback)
    
        The runTask method is used to run the task within the specified execution
        context.  After the task has been completed, the context completed results
        are saved to the completed member.
        */
        runTask: function(task, callback) {
            var context = this,
                runnerResult;
    
            function done(err) {
                if (err) return callback(err);
    
                // save the result of the task to the completed results
                context.completed[task.name] = typeof arguments[1] != 'undefined' ? arguments[1] : true;
    
                // fire the callback
                callback.apply(task, arguments);
            }
    
            // execute the task
            runnerResult = task.runner.call(task, context);
    
            // if the task has completion listeners, then bind
            if (task._completionListeners) {
                task._completionListeners.push(done);
            }
            else {
                done(null, runnerResult);
            }
        }
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
    ## taskify.reset
    
    Reset the registry - clear existing task definitions.
    */
    taskify.reset = function() {
        // reset the registry
        registry = {};
    };
    
    taskify.run = function(context, target, callback) {
        var task, runner, deps;
    
        // if the execution context is a string, then we don't have one
        if (typeof context == 'string' || (context instanceof String)) {
            callback = target;
            target = context;
            context = null;
        }
    
        // get the requested task from the registry
        task = registry[target];
    
        // if the task is not found, then return an error
        if (! task) return callback(new Error('Task "' + target + '" not found'));
    
        // ensure we have an execution context
        context = context || new ExecutionContext();
    
        // initialise the runner for depedendant tasks
        runner = taskify.run.bind(null, context);
    
        // determine the actual deps (i.e. those task deps that have not already been run)
        deps = _.without(task._deps, Object.keys(context.completed));
    
        // run the dependent tasks first
        async.forEach(deps, runner, function(err) {
            if (err) return callback(err);
    
            // get the execution context to run the task
            context.runTask(task, callback);
        });
    };
    
    return typeof taskify != 'undefined' ? taskify : undefined;
}));