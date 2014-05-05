var test = require('tape');
var task = require('..')();
var executed = [];
var pull = require('pull-stream');
var a, b, c;

function trackTask() {
  executed.push(this.name);

  return true;
}

test('register a', function(t) {
  t.plan(1);
  a = task('a', { deps: ['b'] }, trackTask);
  t.ok(task.get('a'), 'registered');
});

test('catch dependency error', function(t) {
  t.plan(2);

  pull(
    pull.values(['a', 'a', 'a']),
    pull.asyncMap(task.exec),
    pull.collect(function(err, values) {
      t.ok(err instanceof Error);
      t.equal(err.message, 'Task "b" not found');
    })
  );
});

test('register b', function(t) {
  t.plan(1);
  b = task('b', trackTask);
  t.ok(task.get('b'), 'registered');
});

test('run a + b', function(t) {
  executed = [];

  t.plan(2);
  pull(
    pull.values(['a', 'a', 'a']),
    pull.asyncMap(task.exec),
    pull.collect(function(err, values) {
      t.ifError(err);
      t.deepEqual(values, [true, true, true], 'executed tasks');
    })
  );
});
