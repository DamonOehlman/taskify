var test = require('tape');
var taskify = require('..');
var q = require('q');

require('./helpers/prepare-tasks');

test('use q', function(t) {
  t.plan(2);

  taskify.defaults({
    promiseLib: require('q')
  });

  t.ok(taskify.defaults('promiseLib'), 'have a promise lib');
  t.ok(typeof taskify.defaults('promiseLib').defer == 'function', 'have defer fn');
});

test('run a task and get a promise', function(t) {
  t.plan(1);
  taskify.run('a').promise.then(function() {
    t.pass('promise resolved');
  });
});

test('run tasks in parallel using promises', function(t) {
  var promises = ['a', 'b'].map(function(taskName) {
    return taskify.run(taskName).promise;
  });

  t.plan(1);
  q.all(promises).then(function() {
    t.pass('both tasks completed');
  });
});