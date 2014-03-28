var test = require('tape');

module.exports = function(opts) {
  var task = require('../../')(opts);

  test('register a', function(t) {
    t.plan(1);
    task('a', function() {
      setTimeout(this.async(), 50);
    });

    t.ok(task.get('a'), 'registered');
  });

  test('register b', function(t) {
    t.plan(1);
    task('b', function() {
      setTimeout(this.async(), 50);
    });

    t.ok(task.get('b'), 'registered');
  });

  return task;
}
