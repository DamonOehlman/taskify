describe('async execution tests', function() {
    var expect = require('expect.js'),
        eve = require('eve'),
        _ = require('underscore'),
        taskify = require('../taskify');

    before(taskify.reset);

    it('should fail gracefull looking for a non-existant task', function() {
        var task = taskify.get('a');

        expect(task).not.to.be.ok();
    });

    it('should handle running a non-existant task intelligently', function(done) {
        taskify.run('a').once('complete', function(err) {
            expect(err instanceof Error).to.be.ok();
            done();
        });
    });
});