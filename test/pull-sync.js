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

test('register double', function(t) {
  t.plan(1);
  task('double', function(value) {
    return value * 2;
  });

  t.ok(task.get('double'), 'registered double');
});

test('double a series of values', function(t) {
  t.plan(2);
  pull(
    pull.values([5, 6, 7]),
    pull.map(function(val) {
      return ['double', val];
    }),
    pull.asyncMap(task.exec),
    pull.collect(function(err, values) {
      t.ifError(err);
      t.deepEqual(values, [10, 12, 14], 'values doubled');
    })
  );
});
