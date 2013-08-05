var test = require('tape');
var taskify = require('..');

test('reset', function(t) {
  t.plan(1);
  t.ok(taskify.reset(), 'reset');
});

test('define task with missing dep', function(t) {
  t.plan(1);
  taskify('b', ['a'], function() {
  });

  t.ok(taskify.get('b'), 'b defined');
});

test('raise an exception when attempting select strict b', function(t) {
  t.plan(1);
  t.throws(function() {
    taskify.select('b');
  }, 'threw expected error');
});