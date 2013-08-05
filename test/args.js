var test = require('tape');
var taskify = require('../');

test('reset', function(t) {
  taskify.reset();
  t.end();
});

test('passthrough args', function(t) {
  t.plan(1);
  taskify('a', function(value) {
    t.equal(value, 5);
  });

  taskify.run('a', 5);
});