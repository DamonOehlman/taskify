var test = require('tape');
var task = require('../')();

test('passthrough args', function(t) {
  t.plan(1);
  task('a', function(value) {
    t.equal(value, 5);
  });

  task.run('a', 5);
});