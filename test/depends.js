var assert = require('assert'),
    task = require('../'),
    executed = [];

describe('depends tests', function() {
    beforeEach(function() {
        // reset the executed tasks array
        executed = [];
    });

    it('should be able to specify a dependency for a task', function(done) {
        task('a', function(callback) {
            executed.push(this.name);
            callback();
        }).depends('b');

        // run a
        task.run('a', function(err) {
            // expect an error because we are missing module b
            assert(err);
            assert.equal(err.message, 'Task "b" not found');
            done();
        });
    });

    it('should be able to register task b, then run task a', function(done) {
        task('b', function(callback) {
            executed.push(this.name);
            callback();
        });

        task.run('a', function(err) {
            assert.ifError(err);
            assert.deepEqual(executed, ['b', 'a']);

            done();
        });
    });
});