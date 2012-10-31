var assert = require('assert'),
    task = require('../taskify'),
    executed = [],
    a, b, c;

function trackTask() {
    executed.push(this.name);
}

describe('depends tests', function() {
    before(function() {
        task.reset();
    });

    beforeEach(function() {
        // reset the executed tasks array
        executed = [];
    });

    it('should be able to specify a dependency for a task', function(done) {
        a = task('a', { deps: ['b'] }, trackTask);

        // run a
        task.run('a').once('complete', function(err) {
            // expect an error because we are missing module b
            assert(err);
            assert.equal(err.message, 'Task "b" not found');
            done();
        });
    });

    it('should be able to specify a dependency jake style', function(done) {
        a = task('a', ['b'], trackTask);
        task.run('a').once('complete', function(err) {
            assert(err);
            assert.equal(err.message, 'Task "b" not found');
            done();
        });
    });

    it('should be able to register task b, then run task a', function(done) {
        b = task('b', trackTask);
        task.run('a').once('complete', function(err) {
            assert.ifError(err);
            assert.deepEqual(executed, ['b', 'a']);

            done();
        });
    });

    it('should be able to inject an additional dependency for b', function(done) {
        c = task('c', trackTask);
        b.depends('c');

        task.run('a').once('complete', function(err) {
            assert.ifError(err);
            assert.deepEqual(executed, ['c', 'b', 'a']);

            done();
        });
    });

    it('should reject a cyclic dependency', function(done) {
        c.depends('c');

        task.run('a').once('complete', function(err) {
            assert.ifError(err);
            assert.deepEqual(executed, ['c', 'b', 'a']);

            done();
        });
    });
});