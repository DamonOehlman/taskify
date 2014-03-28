var assert = require('assert');
var eve = require('eve');
var test = require('tape');
var task = require('..')();
var _ = require('underscore');

function checkUnique() {
  assert(_.uniq(contexts).length === contexts.length);
}

function runTasks(count, done) {
  var completedCount = 0;
  var taskNames = [].slice.call(arguments, 2);

  for (var ii = 0; ii < count; ii++) {
    task.run(taskNames[ii % taskNames.length]).on('complete', function(err) {
      assert.ifError(err);  
      // increment the completed count
      completedCount += 1;

      // if we have the correct number of contexts, then check unique
      if (completedCount >= count) {
        checkUnique();
        done();
      }
    });
  }
}

test('define sync task', function(t) {
  t.plan(1);
  task('sync', function() {
    contexts.push(this.context);
  });
  t.ok(task.get('sync'), 'sync registered');
});

test('define async task', function(t) {
  t.plan(1);
  task('async', function() {
    var done = this.async();
    var task = this;

    setTimeout(function() {
        contexts.push(task.context);
        done();
    }, 50);
  });
  t.ok(task.get('async'), 'async registered');
});

test('generate sync contexts', function(t) {
  contexts = [];

  t.plan(1);
  runTasks(30, function() {
    t.equal(contexts.length, 30, 'created 30 contexts');
  }, 'sync');
});

test('generate async contexts', function(t) {
  contexts = [];

  t.plan(1);
  runTasks(30, function() {
    t.equal(contexts.length, 30, 'created 30 contexts');
  }, 'async');
});

test('generate mixed contexts', function(t) {
  contexts = [];

  t.plan(1);
  runTasks(30, function() {
    t.equal(contexts.length, 30, 'created 30 contexts');
  }, 'sync', 'async');
});