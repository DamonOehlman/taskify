var test = require('tape');
var task = require('..')();

test('define task', function(t) {
  t.plan(1);
  task('a', function() {
    return 5;
  });

  t.ok(task.get('a'), 'have task');
});

test('capture results from running a', function(t) {
  t.plan(3);
  task.run('a').once('complete', function(err) {
    t.ifError(err);
    t.ok(this.context.results, 'have results object');
    t.equal(this.context.results.a, 5);
  });
});

test('redefine task a', function(t) {
  t.plan(1);
  task('a', function() {
    return 10;
  });

  t.ok(task.get('a'), 'have task');
});

test('capture new results from running a', function(t) {
  t.plan(3);
  task.run('a').once('complete', function(err) {
    t.ifError(err);
    t.ok(this.context.results, 'have results object');
    t.equal(this.context.results.a, 10);
  });
});

test('redefine task a to async', function(t) {
  t.plan(1);
  task('a', function() {
    var done = this.async();

    setTimeout(function() {
      done(null, 15);
    }, 50);
  });

  t.ok(task.get('a'), 'have task');
});

test('capture results from running a', function(t) {
  t.plan(3);
  task.run('a').once('complete', function(err) {
    t.ifError(err);
    t.ok(this.context.results, 'have results object');
    t.equal(this.context.results.a, 15);
  });
});

test('redefine a to async with additional args', function(t) {
  t.plan(1);
  task('a', function() {
    var done = this.async();

    setTimeout(function() {
      done(null, 5, 10);
    }, 10);
  });

  t.ok(task.get('a'), 'task a defined');
});

test('capture two results from running a', function(t) {
  t.plan(3);
  task.run('a').once('complete', function(err) {
    t.ifError(err);
    t.ok(this.context.results, 'have results object');
    t.deepEqual(this.context.results.a, [5, 10]);
  });
});

test('define b', function(t) {
  t.plan(1);
  task('b', ['a'], function() {
    return 'hello';
  });

  t.ok(task.get('b'), 'b defined');
});

test('run b and capture results for a and b', function(t) {
  t.plan(4);

  task.run('b').once('complete', function(err) {
    t.ifError(err);
    t.ok(this.context.results, 'have results object');
    t.deepEqual(this.context.results.a, [5, 10]);
    t.equal(this.context.results.b, 'hello');
  });
});