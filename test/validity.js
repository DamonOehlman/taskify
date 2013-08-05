var test = require('tape');
var taskify = require('..');

test('reset', function(t) {
  t.plan(1);
  t.ok(taskify.reset(), 'reset');
});

test('register b', function(t) {
  t.plan(1);
  taskify('b', ['a'], function() {});
  t.ok(taskify.get('b'), 'b registered');
});

test('b fails validity check', function(t) {
  var task;

  t.plan(2);
  task = taskify.get('b');

  t.ok(task, 'got task');
  t.notOk(task.isValid(), 'task not valid');
});

test('b reports unresolved dependencies', function(t) {
  t.plan(2);
  t.deepEqual(taskify.get('b').unresolved(), ['a']);
  t.notOk(taskify.get('b').isValid(), 'not valid');
});

test('define c - with dependencies on b', function(t) {
  t.plan(1);
  taskify('c', ['b'], function() {});
  t.ok(taskify.get('c'), 'c defined');
});

test('c not valid, but resolved', function(t) {
  var c;

  t.plan(3);
  t.ok(c = taskify.get('c'), 'found c');
  t.deepEqual(c.unresolved(), [], 'no unresolved deps for c');
  t.notOk(c.isValid(), 'not valid (b missing deps)');
});

test('c unresolved (deep check) returns a', function(t) {
  var c;

  t.plan(2);
  t.ok(c = taskify.get('c'), 'found c');
  t.deepEqual(c.unresolved(true), ['a'], 'found a missing');
});