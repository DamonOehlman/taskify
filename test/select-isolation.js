var assert = require('assert'),
    taskify = require('../'),
    targetValue,
    taskRunner;

describe('select isolation tests', function() {
    before(taskify.reset);

    it('should be able to define a task a task that checks a mutating value against arguments', function() {
        taskify('b', function() {
            assert.equal(arguments[0], targetValue, 'task b mutation: ' + arguments[0] + ' !== ' + targetValue);
        });

        taskify('a', ['b'], function() {
            assert.equal(arguments[0], targetValue, 'task a mutation: ' + arguments[0] + ' !== ' + targetValue);
        });
    });

    it('should be able to run the task with an undefined value', function(done) {
        taskify.run('a', targetValue = undefined).on('complete', done);
    });


    it('should be able to run the task with a simple value', function(done) {
        taskify.run('a', targetValue = 5).on('complete', done);
    });

    it('should be able to run the task with a different simple value', function(done) {
        taskify.run('a', targetValue = 10).on('complete', done);
    });

    it('should be able to select the task for deferred execution', function() {
        taskRunner = taskify.select('a');

        assert(taskRunner);
        assert.equal(typeof taskRunner, 'function');
    });

    it('should be able to run the deferred task with an undefined value', function(done) {
        taskRunner(targetValue = undefined).on('complete', done);
    });

    it('should be able to run the deferred task with a simple value', function(done) {
        taskRunner(targetValue = 5).on('complete', done);
    });

    it('should be able to run the deferred task with a different simple value', function(done) {
        taskRunner(targetValue = 10).on('complete', done);
    });
});