var taskify = module.exports = require('./taskify');

// patch in taskify loader
taskify.loadTasks = require('./lib/loader').bind(taskify);