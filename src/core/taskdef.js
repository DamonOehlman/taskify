/**
# TaskDefinition
*/
function TaskDefinition(name, opts) {
    // ensure we have opts
    opts = opts || {};

    // initialise the task name
    this.name = name;

    // initialise as not async
    this.isAsync = false;

    // initailise the dependencies to be an empty array
    this._deps = _.uniq([].concat(opts.deps || []).concat(_defaults.deps || []));

    // allow a fallback task to be specified
    this._fallback = opts.fallback || _defaults.fallback;
}

TaskDefinition.prototype = {
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
    },

    /**
    ## isValid(missingDeps)

    The valid method looks for the dependencies of the task and attempts to retrieve
    them from the taskify registry.  If all dependencies are resolved, `isValid` will
    return true, or false if not.

    If the method is provided an array for the missingDeps argument, unresolved
    task names will be pushed onto the array and can be accessed for diagnosis of the error.
    */
    isValid: function(missingDeps) {
        var valid = true;

        // iterate through the dependencies and find any that are not defined
        this._deps.forEach(function(taskName) {
            var dep = taskify.get(taskName);

            // update the valid flag
            valid = valid && (typeof dep != 'undefined') && dep.isValid(missingDeps);

            // if the dependency was not found, and we have a missing deps array
            // then add the name to the array
            if ((! dep) && missingDeps && typeof missingDeps.push == 'function') {
                missingDeps.push(taskName);
            }
        });

        return valid;
    }
};