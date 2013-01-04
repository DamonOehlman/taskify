describe('task validity tests', function() {
    var expect = require('expect.js'),
        _ = require('underscore'),
        taskify = require('../taskify');

    before(taskify.reset);

    it('should be able to define a task with an unknown dependency', function() {
        taskify('b', ['a'], function() {});
    });

    it('should know that task b is not valid', function() {
        expect(taskify.get('b').isValid()).to.not.be.ok();
    });

    it('should know that task b is not valid, and a is unresolved', function() {
        var unresolvedDeps = [];

        expect(taskify.get('b').isValid(unresolvedDeps)).to.not.be.ok();
        expect(unresolvedDeps).to.contain('a');
    });

    it('should be able to define a higher level task with unresolved dependencies', function() {
        taskify('c', ['b'], function() {});
    });

    it('should know that task c is not valid', function() {
        expect(taskify.get('c').isValid()).to.not.be.ok();
    });

    it('should know that task c is not valid, and a is unresolved', function() {
        var unresolvedDeps = [];

        expect(taskify.get('c').isValid(unresolvedDeps)).to.not.be.ok();
        expect(unresolvedDeps).to.contain('a');
    });
});