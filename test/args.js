describe('args passthru tests', function() {
    var expect = require('expect.js'),
        eve = require('eve'),
        _ = require('underscore'),
        task = require('../taskify'),
        executed = [],
        a, b, c;

    before(task.reset);

    it('should pass through arguments in a run call to the task handler', function(done) {
        task('a', function(value) {
            expect(value).to.equal(5);
            done();
        });

        task.run('a', 5);
    });
});