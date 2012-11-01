var taskify = require('./taskify'),
    TaskLoader = require('./lib/loader');

// patch in taskify loader
taskify.loadTasks = function(targetPath, callback) {
    var loader = new TaskLoader(taskify).scan(targetPath);

    if (typeof callback == 'function') {
        loader.once('scanned', callback);
    }

    return loader;
};

// export taskify (with extras)
module.exports = taskify;