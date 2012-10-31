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