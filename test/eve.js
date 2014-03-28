var eve = require('eve');
var test = require('tape');
var task = require('../')();
var a, b, c;

function trackTask() {
  executed.push(this.name);
  setTimeout(this.async(), 50);
}

test('register task a', function(t) {
  t.plan(1);
  a = task('a', ['b'], trackTask);
  t.ok(task.get('a'), 'a registered');
});

test('register task b', function(t) {
  t.plan(1);
  b = task('b', trackTask);
  t.ok(task.get('b'), 'b registered');
});

test('exec b, monitor completion via eve', function(t) {
  t.plan(2);

  executed = [];
  eve.once('taskify.complete.a', function(err) {
    t.ifError(err);
    t.deepEqual(executed, ['b', 'a']);
  });

  task.run('a');
});

test('register task c', function(t) {
  t.plan(1);
  a = task('c', trackTask);
  t.ok(task.get('c'), 'c registered');
});

test('inject additional dep, monitor completion via eve', function(t) {
  t.plan(2);
  b.depends('c');

  executed = [];
  eve.once('taskify.complete.a', function(err) {
    t.ifError(err);
    t.deepEqual(executed, ['c', 'b', 'a']);
  });

  task.run('a');  
});