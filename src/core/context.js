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