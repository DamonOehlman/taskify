var taskify = require('../'),
	path = require('path');

taskify.loadTasks(path.resolve(__dirname, 'tasks'));
taskify.run('b');