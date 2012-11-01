describe('eve event capture', function() {
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

    before(task.reset);
    beforeEach(function() {
        // reset the executed tasks array
        executed = [];
    });

    it('should be able to register task a', function() {
        a = task('a', { deps: ['b'] }, trackTask);
    });

    it('should be able to register task b, then run task a', function(done) {
        b = task('b', trackTask);

        eve.once('taskify.complete.a', function(err) {
            expect(err).to.not.be.ok();
            expect(executed).to.eql(['b', 'a']);

            done();
        });

        task.run('a');
    });

    it('should be able to inject an additional dependency for b', function(done) {
        c = task('c', trackTask);
        b.depends('c');

        eve.once('taskify.complete.a', function(err) {
            expect(err).to.not.be.ok();
            expect(executed).to.eql(['c', 'b', 'a']);

            done();
        });

        task.run('a');
    });
});