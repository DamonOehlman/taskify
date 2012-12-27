var taskify = require('../'),
    path = require('path'),
    assert = require('assert');

describe('taskify loader (prefixed) tests', function() {
    it('should be able to load tasks from a specified directory', function() {
        taskify.loadTasks(path.resolve(__dirname, 'test-prefixed-tasks'), 'prefixed');
    });

    it('should have loaded task a', function() {
        assert(taskify.get('prefixed-a'));
    });

    it('should have loaded task b', function() {
        assert(taskify.get('prefixed-b'));
    });

    it('should be able to run task b', function(done) {
        taskify.run('prefixed-b').once('complete', function() {
            assert(this.context.data);
            assert.deepEqual(this.context.data, ['a', 'b']);

            done();
        });
    });
});