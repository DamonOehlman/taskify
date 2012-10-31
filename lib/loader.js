var async = require('async'),
    events = require('events'),
    fs = require('fs'),
    path = require('path'),
    util = require('util'),
    jsOnly = function(filename) {
        return path.extname(filename).toLowerCase() === '.js';
    },
    vm = require('vm'),
    _ = require('underscore');

/**
# TaskLoader

The TaskLoader is used to load task definitions from local files into taskify for execution.
The loader permits task definition, but does not permit task execution to begin.
*/
function TaskLoader(taskify) {
    events.EventEmitter.call(this);

    this.scanning = false;
    this.runArgs = undefined;

    // save a reference to the taskify function call
    this.taskify = taskify;
}

util.inherits(TaskLoader, events.EventEmitter);

/**
## run(taskName)

Queue that a task should be run once loading has been completed.
*/
TaskLoader.prototype.run = function() {
    // if we are scanning, then save the run args
    if (this.scanning) {
        this.runArgs = Array.prototype.slice.call(arguments);
    }
    else {
        this.taskify.run.call(this.taskify, arguments);
    }
};

/**
## scan(targetPath)

Scan the targetPath looking for task definition (.js) files
*/
TaskLoader.prototype.scan = function(targetPath) {
    var loader = this,
        taskify = this.taskify;

    this.scanning = true;
    fs.readdir(targetPath, function(err, files) {
        var taskFiles = (files || []).filter(jsOnly).map(path.join.bind(path, targetPath)),
            sandbox = {
                task: function() {
                    return taskify.apply(taskify, arguments);
                }
            };

        // read each of the target files
        async.map(taskFiles, fs.readFile, function(err, results) {
            // if we hit an error, then report it
            if (err) return loader.emit('error', err);

            // iterate through the loaded files and run in the specified contexts
            results.forEach(function(buffer, index) {
                // run the script
                vm.runInContext(
                    buffer.toString('utf8'),
                    vm.createContext(sandbox),
                    path.basename(taskFiles[index])
                );
            });

            // emit the done event
            loader.emit('scanned');

            // flag as no longer scanning
            loader.scanning = false;

            // if we have runargs, then run the task and then reset the args
            if (loader.runArgs) {
                loader.taskify.run.call(loader.taskify, loader.runArgs);
                loader.runArgs = undefined;
            }
        });
    });

    return this;
};

module.exports = TaskLoader;