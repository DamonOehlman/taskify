describe('execution context isolation tests', function() {
    var expect = require('expect.js'),
        eve = require('eve'),
        _ = require('underscore'),
        task = require('../taskify'),
        contexts = [];

    function checkUnique() {
        expect(_.uniq(contexts).length).to.equal(contexts.length);
    }

    function runTasks(count, done) {
        var completedCount = 0,
            taskNames = Array.prototype.slice.call(arguments, 2);

        for (var ii = 0; ii < count; ii++) {
            task.run(taskNames[ii % taskNames.length]).on('complete', function(err) {
                expect(err).to.not.be.ok();

                // increment the completed count
                completedCount += 1;

                // if we have the correct number of contexts, then check unique
                if (completedCount >= count) {
                    checkUnique();
                    done();
                }
            });
        }
    }

    before(task.reset);
    beforeEach(function() {
        // reset the executed tasks array
        contexts = [];
    });

    eve.on('*', function() {
        // console.log(eve.nt(), arguments);
    });

    it('should be able to define a task that will record contexts synchronously', function() {
        task('sync', function() {
            contexts.push(this.context);
        });
    });

    it('should be able to define a task that will record contexts asynchronously', function() {
        task('async', function() {
            var done = this.async(),
                t = this;

            setTimeout(function() {
                contexts.push(t.context);
                done();
            }, 50);
        });
    });

    it('should generate seperate contexts for synchronous tasks running in parallel', function(done) {
        runTasks(30, done, 'sync');
    });

    it('should generate seperate contexts for asynchronous tasks running in parallel', function(done) {
        runTasks(30, done, 'async');
    });

    it('should generate separate context for a mix of async and sync tasks running parallel', function(done) {
        runTasks(30, done, 'sync', 'async');
    });
});