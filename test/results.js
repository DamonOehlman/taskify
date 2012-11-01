describe('results capture tests', function() {
    var expect = require('expect.js'),
        eve = require('eve'),
        _ = require('underscore'),
        task = require('../taskify');

    before(task.reset);

    it('should be able to define a task', function() {
        task('a', function() {
            return 5;
        });
    });

    it('should be able to capture the results from the task execution', function(done) {
        task.run('a').once('complete', function(err) {
            expect(err).to.not.be.ok();

            expect(this.context.results).to.be.ok();
            expect(this.context.results.a).to.be.equal(5);
            done();
        });
    });

    it('should be able redefine task a to return a different result', function() {
        task('a', function() {
            return 10;
        });
    });

    it('should capture the new result after task execution', function(done) {
        task.run('a').once('complete', function(err) {
            expect(err).to.not.be.ok();

            expect(this.context.results).to.be.ok();
            expect(this.context.results.a).to.be.equal(10);
            done();
        });
    });

    it('should be able to define an async task that produces a result', function() {
        task('a', function() {
            var done = this.async();

            setTimeout(function() {
                done(null, 5);
            }, 10);
        });
    });

    it('should be able to capture the async result of the task execution', function(done) {
        task.run('a').once('complete', function(err) {
            expect(err).to.not.be.ok();

            expect(this.context.results).to.be.ok();
            expect(this.context.results.a).to.be.equal(5);
            done();
        });
    });

    it('should be able to return extra args in the async done call', function() {
        task('a', function() {
            var done = this.async();

            setTimeout(function() {
                done(null, 5, 10);
            }, 10);
        });
    });

    it('should be able to capture multiple results passed through the async done call as an array', function(done) {
        task.run('a').once('complete', function(err) {
            expect(err).to.not.be.ok();

            expect(this.context.results).to.be.ok();
            expect(this.context.results.a).to.be.eql([5, 10]);
            done();
        });
    });

    it('should be able to define a second function to capture results for', function() {
        task('b', ['a'], function() {
            return 'hello';
        });
    });

    it('should be able to exec b (depends on a) and capture both results', function(done) {
        task.run('b').once('complete', function(err) {
            expect(err).to.not.be.ok();

            expect(this.context.results).to.be.ok();
            expect(this.context.results.a).to.be.eql([5, 10]);
            expect(this.context.results.b).to.be.equal('hello');
            done();
        });
    });
});