describe('error handling', function() {
    var expect = require('expect.js'),
        eve = require('eve'),
        _ = require('underscore'),
        task = require('../taskify'),
        cannedError = new Error('Something went wrong');

    beforeEach(task.reset);

    it('should be able to capture errors returned from synchronous tasks', function(done) {
        task('a', function() {
            return cannedError;
        });

        task.run('a').on('complete', function(err) {
            expect(err instanceof Error).to.be.ok();
            done();
        });
    });

    it('should be able to capture errors in asynchronous tasks', function(done) {
        task('a', function() {
            var cb = this.async();

            setTimeout(function() {
                cb(cannedError);
            }, 100);
        });

        task.run('a').on('complete', function(err) {
            expect(err instanceof Error).to.be.ok();
            done();
        });
    });

    it('should pass errors through from dependent tasks (sync)', function(done) {
        task('a', ['b'], function() {
            throw new Error('Task a ran but shouldn\'t have');
        });

        task('b', function() {
            return cannedError;
        });

        task.run('a').on('complete', function(err) {
            expect(err instanceof Error).to.be.ok();
            done();
        });
    });

    it('should pass errors through from dependent tasks (async)', function(done) {
        task('a', ['b'], function() {
            throw new Error('Task a ran but shouldn\'t have');
        });

        task('b', function() {
            var cb = this.async();

            setTimeout(function() {
                cb(cannedError);
            }, 100);
        });

        task.run('a').on('complete', function(err) {
            expect(err instanceof Error).to.be.ok();
            done();
        });
    });
});