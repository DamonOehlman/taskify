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
            fallbackProxy;

        // if we hit an error, and we have a callback, then run the fallback
        if (err && this.fallback) {
            fallbackProxy = this.context.exec(this.fallback, this.execArgs);

            // when the fallback task completes, run the completion event
            fallbackProxy.on('complete', task.complete.bind(task));

            // prevent further execution
            return;
        }

        // if we have an execution context for the task, then update the results
        // but only if we didn't receive an error
        if (this.name && this.context && (! err)) {
            this.context.results[this.name] = taskResult || true;
        }

        setTimeout(function() {
            eve.apply(null, ['task.complete.' + task.id, task].concat(args));
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

['on', 'once'].forEach(function(bindingName) {
    TaskProxy.prototype[bindingName] = function(eventName, handler) {
        eve[bindingName]('task.' + eventName + '.' + this.id, handler);
    };
});