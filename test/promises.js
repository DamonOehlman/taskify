describe('promises implementation (using q)', function() {
    var expect = require('expect.js'),
        taskify = require('../taskify'),
        q = require('q');

    before(function() {
        taskify.defaults({
            promiseLib: 'q'
        });

        taskify('a', function() {
            setTimeout(this.async(), 50);
        });

        taskify('b', function() {
            setTimeout(this.async(), 200);
        });
    });

    it('should be able to run a task and get a promise', function(done) {
        taskify.run('a').promise.then(done);
    });

    it('should be able to run tasks in parallel using promises', function(done) {
        var promises = ['a', 'b'].map(function(taskName) {
            return taskify.run(taskName).promise;
        });

        q.all(promises).then(function() {
            done();
        });
    });
});