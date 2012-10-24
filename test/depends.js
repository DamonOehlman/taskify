var assert = require('assert'),
    task = require('../'); 

describe('depends tests', function() {
    it('should be able to specify a dependency for a task', function(done) {
        task('a', function(callback) {
            callback();
        }).depends('b');

        // run a
        task.run('a', function(err) {
            // expect an error because we are missing module b
            assert(err);
            done();
        });
    });
});