var test = require('tape');
var when = require('when');
var task  = require('./helpers/prepare-tasks')({ promise: when });

test('run a task and get a promise', function(t) {
  t.plan(1);
  task.run('a').promise.then(function() {
    t.pass('promise resolved');
  });
});

test('run tasks in parallel using promises', function(t) {
  var promises = ['a', 'b'].map(function(taskName) {
    return task.run(taskName).promise;
  });

  t.plan(1);
  when.all(promises).then(function() {
    t.pass('both tasks completed');
  });
});