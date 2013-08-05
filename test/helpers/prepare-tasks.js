var test = require('tape');
var taskify = require('../..');

test('reset', function(t) {
  t.plan(1);
  t.ok(taskify.reset(), 'reset ok');
});

test('register a', function(t) {
  t.plan(1);
  taskify('a', function() {
    setTimeout(this.async(), 50);
  });

  t.ok(taskify.get('a'), 'registered');
});

test('register b', function(t) {
  t.plan(1);
  taskify('b', function() {
    setTimeout(this.async(), 50);
  });

  t.ok(taskify.get('b'), 'registered');
});
