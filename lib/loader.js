var path = require('path'),
    fs = require('fs'),
    jsOnly = function(filename) {
        return path.extname(filename).toLowerCase() === '.js';
    };

module.exports = function(targetPath) {
    var files = fs.readdirSync(targetPath).filter(jsOnly),
        taskify = this;

    // iterate through the files
    files.forEach(function(file) {
        var mod = require(path.join(targetPath, file)),
            taskName = path.basename(file, path.extname(file)),
            opts = {};

        // copy any additional exports from the mod into the opts
        Object.keys(mod).forEach(function(key) {
            opts[key] = mod[key]; 
        });

        // register the task
        taskify(taskName, opts, mod);
    });
};