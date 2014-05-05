var test = require('tape');
var task = require('..')();
var pull = require('pull-stream');
var executed = [];
var a;
var b;
var c;

function trackTask() {
  var callback = this.async();

  executed.push(this.name);
  setTimeout(function() {
    callback(null, true);
  }, 50);
}

test('specify a dependency', function(t) {
  a = task('a', { deps: ['b'] }, trackTask);
  executed = [];

  // run a
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

test('specify dependency (jake style)', function(t) {
  a = task('a', ['b'], trackTask);
  executed = [];

  // run a
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

test('register task b', function(t) {
  b = task('b', trackTask);
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
})

test('register additional dependency', function(t) {
  c = task('c', trackTask);
  b.depends('c');
  executed = [];

  t.plan(3);
  pull(
    pull.values(['a', 'a', 'a']),
    pull.asyncMap(task.exec),
    pull.collect(function(err, values) {
      t.ifError(err);
      t.deepEqual(values, [true, true, true], 'executed tasks');
      t.deepEqual(executed, ['c', 'b', 'a', 'c', 'b', 'a', 'c', 'b', 'a'], 'executed in expected order');
    })
  );
});

test('reject cyclic dependency (c --> c)', function(t) {
  c.depends('c');
  executed = [];

  t.plan(3);
  pull(
    pull.values(['a', 'a', 'a']),
    pull.asyncMap(task.exec),
    pull.collect(function(err, values) {
      t.ifError(err);
      t.deepEqual(values, [true, true, true], 'executed tasks');
      t.deepEqual(executed, ['c', 'b', 'a', 'c', 'b', 'a', 'c', 'b', 'a'], 'executed in expected order');
    })
  );
});

/*
// TODO
test('reject cyclic dependency (c --> a)', function(t) {
  c.depends('a');
  executed = [];

  t.plan(2);
  taskify.run('a').once('complete', function(err) {
    t.ifError(err, 'no error');
    t.deepEqual(executed, ['c', 'b', 'a']);
  });
});*/
