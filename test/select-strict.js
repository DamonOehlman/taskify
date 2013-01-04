var assert = require('assert'),
    taskify = require('../'),
    targetValue,
    taskRunner;

describe('selectStrict tests', function() {
    before(taskify.reset);
    
    it('should be able to define a task with a missing dependency', function() {
        taskify('b', ['a'], function() {
        });
    });

    it('should raise an exception when attempting to selectStrict the defined task', function() {
        assert.throws(taskify.selectStrict.bind(null, 'b'));
    });
});