var test = require('tape');
var taskify = require('..');
var cannedError = new Error('Something went wrong');

test('callback handler involved synchronously', function(t) {
  var fellback = false;

  taskify.reset();

  taskify('a', { fallback: 'c' }, function() {
    return cannedError;
  });

  taskify('c', function() {
    fellback = true;
  });

  t.plan(2);
  taskify.run('a').on('complete', function(err) {
    t.ifError(err, 'captured error, did not fallback');
    t.equal(fellback, true);
  });
});

/*test('pass original args to fallback handler', function(t) {
  var fellback = false;

  taskify.reset();

  taskify('a', { fallback: 'c' }, function(value) {
    t.equal(value, 5);
    return cannedError;
  });

  taskify('c', function(value) {
    t.equal(value, t);
    fellback = true;
  });

  t.plan(4);
  taskify.run('a', 5).on('complete', function(err) {
    t.ifError(err);
    t.equal(fellback, true);
  });
});*/