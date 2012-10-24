// req: async

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
}

TaskInstance.prototype = {
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

function taskify(name, opts, runner) {
    var task;

    // handle the noopts case
    if (typeof opts == 'function') {
        runner = opts;
        opts = {};
    }

    // create the task instance
    // and save the new task instance to the registry
    task = registry[name] = new TaskInstance(name, opts);

    // bind the exec function to the runner instance
    task.runner = runner;

    // return the task instance
    return task;
}

taskify.run = function(target, callback) {
    // get the requested task from the registry
    var task = registry[target];

    // if the task is not found, then return an error
    if (! task) return callback(new Error('Task "' + target + '" not found'));

    // run the dependent tasks first
    async.map(task._deps, taskify.run, function(err, results) {
        if (err) return callback(err);

        // otherwise execute the task
        task.runner.call(task, callback);
    });
};