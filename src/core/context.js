/**
# ExecutionContext
*/
function ExecutionContext(registry) {
    // save the registry copy for local reference
    this.registry = registry  || {};

    // initialise the completed result container
    this.completed = {};
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
        _.without(task._deps, Object.keys(this.completed)),

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
                runnerResult = task.runner.call(task, context);
            }

            // if the task is not async, then complete the task
            if (! task.isAsync) {
                task.complete(null, runnerResult);
            }
        }
    );

    return task;
};