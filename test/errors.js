var test = require('tape');
var cannedError = new Error('Something went wrong');

test('capture errors returned from synchronous tasks', function(t) {
  var task = require('../')();

  task('a', function() {
    return cannedError;
  });

  t.plan(2);
  task.run('a').on('complete', function(err) {
    t.ok(err instanceof Error, 'captured error');
    t.ok(this.context.errors.length > 0, 'errors captured in context');
  });
});

test('capture errors in asynchronous tasks', function(t) {
  var task = require('../')();

  task('a', function() {
    var cb = this.async();

    setTimeout(function() {
      cb(cannedError);
    }, 100);
  });

  t.plan(2);
  task.run('a').on('complete', function(err) {
    t.ok(err instanceof Error, 'captured error');
    t.ok(this.context.errors.length > 0, 'errors captured in context');
  });
});

test('pass through errors (sync)', function(t) {
  var task = require('../')();

  task('a', ['b'], function() {
    t.fail('Task a ran but shouldn\'t have');
  });

  task('b', function() {
    return cannedError;
  });

  t.plan(2);
  task.run('a').on('complete', function(err) {
    t.ok(err instanceof Error, 'captured error');
    t.ok(this.context.errors.length > 0, 'errors captured in context');
  });
});

test('pass through errors (async)', function(t) {
  var task = require('../')();

  task('a', ['b'], function() {
    t.fail('Task a ran but shouldn\'t have');
  });

  task('b', function() {
    var cb = this.async();

    setTimeout(function() {
      cb(cannedError);
    }, 100);
  });

  t.plan(2);
  task.run('a').on('complete', function(err) {
    t.ok(err instanceof Error, 'captured error');
    t.ok(this.context.errors.length > 0, 'errors captured in context');
  });
});