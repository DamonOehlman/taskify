var taskify = require('./taskify'),
    TaskLoader = require('./lib/loader');

// patch in taskify loader
taskify.loadTasks = function(targetPath) {
    // start loading the files from the target path
    return new TaskLoader(taskify).scan(targetPath);
};

// export taskify (with extras)
module.exports = taskify;