var eve = require('eve');
var test = require('tape');
var taskify = require('..');
var a, b, c;

function trackTask() {
  executed.push(this.name);
  setTimeout(this.async(), 50);
}

test('taskify reset', function(t) {
  t.plan(1);
  t.ok(taskify.reset(), 'no tasks');
});

test('register task a', function(t) {
  t.plan(1);
  a = taskify('a', ['b'], trackTask);
  t.ok(taskify.get('a'), 'a registered');
});

test('register task b', function(t) {
  t.plan(1);
  b = taskify('b', trackTask);
  t.ok(taskify.get('b'), 'b registered');
});

test('exec b, monitor completion via eve', function(t) {
  t.plan(2);

  executed = [];
  eve.once('taskify.complete.a', function(err) {
    t.ifError(err);
    t.deepEqual(executed, ['b', 'a']);
  });

  taskify.run('a');
});

test('register task c', function(t) {
  t.plan(1);
  a = taskify('c', trackTask);
  t.ok(taskify.get('c'), 'c registered');
});

test('inject additional dep, monitor completion via eve', function(t) {
  t.plan(2);
  b.depends('c');

  executed = [];
  eve.once('taskify.complete.a', function(err) {
    t.ifError(err);
    t.deepEqual(executed, ['c', 'b', 'a']);
  });

  taskify.run('a');  
});