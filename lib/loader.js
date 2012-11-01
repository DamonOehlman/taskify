var async = require('async'),
    events = require('events'),
    fs = require('fs'),
    path = require('path'),
    util = require('util'),
    Module = require('module'),
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

    function createNewSandbox(filename) {
        var sandbox = {},
            mod = new Module(path.basename(filename, path.extname(filename)), module);

        for (var k in global) {
            sandbox[k] = global[k];
        }

        sandbox.module = mod;
        sandbox.require = mod.require.bind(mod);
        sandbox.__filename = mod.filename = filename;
        sandbox.__dirname = path.dirname(filename);
        sandbox.global = sandbox;
        sandbox.root = root;        

        // add the task definition aliases
        sandbox.taskify = defineTask;
        sandbox.task = defineTask;

        return sandbox;
    }

    function defineTask() {
        return taskify.apply(taskify, arguments);
    }

    this.scanning = true;
    fs.readdir(targetPath, function(err, files) {
        var taskFiles = (files || []).filter(jsOnly).map(path.join.bind(path, targetPath));

        // read each of the target files
        async.map(taskFiles, fs.readFile, function(err, results) {
            // if we hit an error, then report it
            if (err) return loader.emit('error', err);

            // iterate through the loaded files and run in the specified contexts
            results.forEach(function(buffer, index) {
                var script = vm.createScript(buffer.toString('utf8'), taskFiles[index]);

                // run the script
                script.runInNewContext(vm.createContext(createNewSandbox(taskFiles[index])));
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