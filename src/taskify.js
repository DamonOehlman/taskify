// req: async, underscore as _

// define the task registry
var registry = {};

//= core/task
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