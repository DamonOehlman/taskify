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