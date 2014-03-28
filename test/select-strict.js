var test = require('tape');
var task = require('..')();

test('define task with missing dep', function(t) {
  t.plan(1);
  task('b', ['a'], function() {
  });

  t.ok(task.get('b'), 'b defined');
});

test('raise an exception when attempting select strict b', function(t) {
  t.plan(1);
  t.throws(function() {
    task.select('b');
  }, 'threw expected error');
});