var test = require('tape');
var task = require('..')();

test('register b', function(t) {
  t.plan(1);
  task('b', ['a'], function() {});
  t.ok(task.get('b'), 'b registered');
});

test('b fails validity check', function(t) {
  var targetTask;

  t.plan(2);
  targetTask = task.get('b');

  t.ok(targetTask, 'got task');
  t.notOk(targetTask.isValid(), 'task not valid');
});

test('b reports unresolved dependencies', function(t) {
  t.plan(2);
  t.deepEqual(task.get('b').unresolved(), ['a']);
  t.notOk(task.get('b').isValid(), 'not valid');
});

test('define c - with dependencies on b', function(t) {
  t.plan(1);
  task('c', ['b'], function() {});
  t.ok(task.get('c'), 'c defined');
});

test('c not valid, but resolved', function(t) {
  var c;

  t.plan(3);
  t.ok(c = task.get('c'), 'found c');
  t.deepEqual(c.unresolved(), [], 'no unresolved deps for c');
  t.notOk(c.isValid(), 'not valid (b missing deps)');
});

test('c unresolved (deep check) returns a', function(t) {
  var c;

  t.plan(2);
  t.ok(c = task.get('c'), 'found c');
  t.deepEqual(c.unresolved(true), ['a'], 'found a missing');
});