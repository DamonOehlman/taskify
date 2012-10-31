// req: async, underscore as _, eve

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
## taskify.get

Get a task by name
*/
taskify.get = function(taskName) {
    return registry[taskName];
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
    var args = Array.prototype.slice.call(arguments, 1);

    // create the execution context, passing the task registry
    return new ExecutionContext(_.clone(registry)).exec(target, args);
};