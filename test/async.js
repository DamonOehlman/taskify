describe('async execution tests', function() {
    var expect = require('expect.js'),
        eve = require('eve'),
        _ = require('underscore'),
        task = require('../taskify'),
        executed = [],
        a, b, c;

    function trackTask() {
        executed.push(this.name);
        setTimeout(this.async(), 50);
    }

    beforeEach(function() {
        // reset the executed tasks array
        executed = [];
    });

    it('should be able to specify a dependency for a task', function(done) {
        a = task('a', { deps: ['b'] }, trackTask);

        // run a
        task.run('a').once('complete', function(err) {
            // expect an error because we are missing module b
            expect(err).to.be.ok();
            expect(err.message).to.equal('Task "b" not found');
            done();
        });
    });

    it('should be able to specify a dependency jake style', function(done) {
        a = task('a', ['b'], trackTask);
        task.run('a').once('complete', function(err) {
            expect(err).to.be.ok();
            expect(err.message).to.equal('Task "b" not found');
            done();
        });
    });

    it('should be able to register task b, then run task a', function(done) {
        b = task('b', trackTask);
        task.run('a').once('complete', function(err) {
            expect(err).to.be(null);
            expect(executed).to.eql(['b', 'a']);

            done();
        });
    });

    it('should be able to inject an additional dependency for b', function(done) {
        c = task('c', trackTask);
        b.depends('c');

        task.run('a').once('complete', function(err) {
            expect(err).to.be(null);
            expect(executed).to.eql(['c', 'b', 'a']);

            done();
        });
    });

    it('should reject a cyclic dependency', function(done) {
        c.depends('c');

        task.run('a').once('complete', function(err) {
            expect(err).to.be(null);
            expect(executed).to.eql(['c', 'b', 'a']);

            done();
        });
    });
});