var test = require('tape');
var taskify = require('..');
var executed = [];
var a, b, c;

function trackTask() {
  executed.push(this.name);
}

test('reset', function(t) {
  t.plan(1);
  t.ok(taskify.reset(), 'reset');
});

test('register a', function(t) {
  t.plan(1);
  a = taskify('a', { deps: ['b'] }, trackTask);
  t.ok(taskify.get('a'), 'registered');
});

test('catch dependency error', function(t) {
  t.plan(2);
  taskify.run('a').once('complete', function(err) {
    t.ok(err instanceof Error);
    t.equal(err.message, 'Task "b" not found');
  });
});

test('register b', function(t) {
  t.plan(1);
  b = taskify('b', trackTask);
  t.ok(taskify.get('b'), 'registered');
});

test('run a + b', function(t) {
  executed = [];

  t.plan(2);
  taskify.run('a').once('complete', function(err) {
    t.ifError(err);
    t.deepEqual(executed, ['b', 'a']);
  });
});