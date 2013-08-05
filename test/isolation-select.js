var assert = require('assert');
var test = require('tape');
var taskify = require('..');
var targetValue;
var taskRunner;

test('reset', function(t) {
  t.plan(1);
  t.ok(taskify.reset(), 'reset');
});

test('register a', function(t) {
  t.plan(1);
  taskify('a', ['b'], function() {
    assert.equal(arguments[0], targetValue);
  });

  t.ok(taskify.get('a'), 'registered a');
});

test('register b', function(t) {
  t.plan(1);
  taskify('b', function() {
    assert.equal(arguments[0], targetValue);
  });

  t.ok(taskify.get('b'), 'registered b');
});

test('run with undefined value', function(t) {
  t.plan(1);
  taskify.run('a', targetValue = undefined).on('complete', function() {
    t.pass('completed');
  });
});

test('run with simple value (5)', function(t) {
  t.plan(1);
  taskify.run('a', targetValue = 5).on('complete', function() {
    t.pass('completed');
  });
});

test('run with simple value (10)', function(t) {
  t.plan(1);
  taskify.run('a', targetValue = 10).on('complete', function() {
    t.pass('completed');
  });
});

test('select the task for deferred execution', function(t) {
  t.plan(1);
  taskRunner = taskify.select('a');
  t.equal(typeof taskRunner, 'function', 'got task runner');
});

test('run defered with undefined value', function(t) {
  t.plan(1);
  taskRunner(targetValue = undefined).on('complete', function() {
    t.pass('completed');
  });
});

test('run defered with simple value (5)', function(t) {
  t.plan(1);
  taskRunner(targetValue = 5).on('complete', function() {
    t.pass('completed');
  });
});

test('run defered with simple value (10)', function(t) {
  t.plan(1);
  taskRunner(targetValue = 10).on('complete', function() {
    t.pass('completed');
  });
});