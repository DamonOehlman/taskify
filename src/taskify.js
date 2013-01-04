// req: async, underscore as _, eve

// define the task registry
var registry = {},
    taskCounter = 1,
    _defaults = {};

//= core/taskdef
//= core/taskproxy
//= core/context

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
        deps = [].concat(target || []),
        tmpTask;

    // create a temporary task definition with deps on the specified target(s)
    // TODO: generate a UUID for the task
    tmpTask = new TaskDefinition('ghost' + taskCounter, { deps: deps });

    // increment the task counter
    taskCounter += 1;

    return function() {
        // create the new execution context
        var context = new ExecutionContext(_.clone(registry)),
            args = initArgs.concat(Array.prototype.slice.call(arguments)),
            callback,
            proxy;

        // if we have been supplied a function as the last argument
        // then we will assume it is a callback function
        // TODO: investigate making this toggleable with a taskify switch ?
        if (typeof args[args.length - 1] == 'function') {
            callback = args.pop();
        }

        // execute the task with the specified args
        proxy = context.exec(tmpTask, args);

        // if we have a callback defined then attach it to the complete event of the proxy
        if (callback) { 
            proxy.once('complete', callback);
        }

        return proxy;
    };
};

/**
## taskify.selectStrict

The selectStrict function passes control through to the `taskify.select` function, but only
once it has validated that task dependencies have been satisfied.  If dependencies cannot be
satisfied then an Error will be thrown.
*/
taskify.selectStrict = function(target) {
    var deps = [].concat(target || []),
        resolvedDeps = deps.map(taskify.get).filter(_.identity),
        isValid = deps.length === resolvedDeps.length;

    // now check that each of the dependencies is valid
    isValid = isValid && resolvedDeps.reduce(function(memo, task) {
        return memo && task.valid;
    }, isValid);

    if (! isValid) {
        throw new Error('Unable to select tasks (missing dependencies): "' + deps.join(', ') + '"');
    }

    return taskify.select.apply(this, arguments);
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