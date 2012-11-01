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
    var context = new ExecutionContext(_.clone(registry)),
        deps, tmpTask;

    // create a temporary task definition with deps on the specified target(s)
    // TODO: generate a UUID for the task
    tmpTask = new TaskDefinition('ghost' + taskCounter, { deps: [].concat(target || [])});

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