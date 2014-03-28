var test = require('tape');
var cannedError = new Error('Something went wrong');

test('fallback handler involved synchronously', function(t) {
  var fellback = false;
  var task = require('../')();

  task('a', { fallback: 'c' }, function() {
    return cannedError;
  });

  task('c', function() {
    fellback = true;
  });

  t.plan(2);
  task.run('a').on('complete', function(err) {
    t.ifError(err, 'captured error, did not fallback');
    t.equal(fellback, true);
  });
});

test('pass original args to fallback handler', function(t) {
  var fellback = false;
  var task = require('../')();

  task('a', { fallback: 'c' }, function(value) {
    t.equal(value, 5);
    return cannedError;
  });

  task('c', function(value) {
    t.equal(value, 5);
    fellback = true;
  });

  t.plan(4);
  task.run('a', 5).on('complete', function(err) {
    t.ifError(err);
    t.equal(fellback, true);
  });
});