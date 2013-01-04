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
    }
};

Object.defineProperty(TaskDefinition.prototype, 'valid', {
    get: function() {
        var deps = this._deps,
            resolvedDeps = deps.map(taskify.get).filter(_.identity),
            isValid = resolvedDeps.length === deps.length;

        // check that each of the dependencies is valid
        isValid = resolvedDeps.reduce(function(memo, task) {
            return memo && task.valid;
        }, isValid);

        return isValid;
    }
});