var test = require('tape');
var taskify = require('..');
var cannedError = new Error('Something went wrong');

test('capture errors returned from synchronous tasks', function(t) {
  taskify('a', function() {
    return cannedError;
  });

  t.plan(2);
  taskify.run('a').on('complete', function(err) {
    t.ok(err instanceof Error, 'captured error');
    t.ok(this.context.errors.length > 0, 'errors captured in context');
  });
});

test('capture errors in asynchronous tasks', function(t) {
  taskify.reset();
  taskify('a', function() {
    var cb = this.async();

    setTimeout(function() {
      cb(cannedError);
    }, 100);
  });

  t.plan(2);
  taskify.run('a').on('complete', function(err) {
    t.ok(err instanceof Error, 'captured error');
    t.ok(this.context.errors.length > 0, 'errors captured in context');
  });
});

test('pass through errors (sync)', function(t) {
  taskify.reset();

  taskify('a', ['b'], function() {
    t.fail('Task a ran but shouldn\'t have');
  });

  taskify('b', function() {
    return cannedError;
  });

  t.plan(2);
  taskify.run('a').on('complete', function(err) {
    t.ok(err instanceof Error, 'captured error');
    t.ok(this.context.errors.length > 0, 'errors captured in context');
  });
});

test('pass through errors (async)', function(t) {
  taskify.reset();

  taskify('a', ['b'], function() {
    t.fail('Task a ran but shouldn\'t have');
  });

  taskify('b', function() {
    var cb = this.async();

    setTimeout(function() {
      cb(cannedError);
    }, 100);
  });

  t.plan(2);
  taskify.run('a').on('complete', function(err) {
    t.ok(err instanceof Error, 'captured error');
    t.ok(this.context.errors.length > 0, 'errors captured in context');
  });
});