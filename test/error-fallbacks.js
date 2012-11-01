describe('error fallback handling', function() {
    var expect = require('expect.js'),
        eve = require('eve'),
        _ = require('underscore'),
        task = require('../taskify'),
        cannedError = new Error('Something went wrong');

    beforeEach(task.reset);

    it('a fallback handler can be specified and invoked for a synchronous task', function(done) {
        var fellback = false;

        task('a', { fallback: 'c' }, function() {
            return cannedError;
        });

        task('c', function() {
            fellback = true;
        });

        task.run('a').on('complete', function(err) {
            expect(err).to.not.be.ok();
            expect(fellback).to.be.ok();
            done();
        });
    });

    it('should pass original run args to the fallback handler', function(done) {
        var fellback = false;

        task('a', { fallback: 'c' }, function(value) {
            expect(value).to.equal(5);
            return cannedError;
        });

        task('c', function(value) {
            expect(value).to.equal(5);
            fellback = true;
        });

        task.run('a', 5).on('complete', function(err) {
            expect(err).to.not.be.ok();
            expect(fellback).to.be.ok();
            done();
        });
    });
});