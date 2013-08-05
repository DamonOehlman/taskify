var test = require('tape');
var taskify = require('..');
var executed = [];
var a;
var b;
var c;

function trackTask() {
  executed.push(this.name);
  setTimeout(this.async(), 50);
}

test('reset', function(t) {
  taskify.reset();
  t.end();
});

test('specify a dependency', function(t) {
  a = taskify('a', { deps: ['b'] }, trackTask);
  executed = [];

  // run a
  t.plan(2);
  taskify.run('a').once('complete', function(err) {
    t.ok(err, 'captured error');
    t.equal(err.message, 'Task "b" not found');
  });
});

test('specify dependency (jake style)', function(t) {
  a = taskify('a', ['b'], trackTask);
  executed = [];

  // run a
  t.plan(2);
  taskify.run('a').once('complete', function(err) {
    t.ok(err, 'captured error');
    t.equal(err.message, 'Task "b" not found');
  });
});

test('register task b', function(t) {
  b = taskify('b', trackTask);
  executed = [];

  t.plan(2);
  taskify.run('a').once('complete', function(err) {
    t.ifError(err, 'no error');
    t.deepEqual(executed, ['b', 'a']);
  });
})

test('register additional dependency', function(t) {
  c = taskify('c', trackTask);
  b.depends('c');
  executed = [];

  t.plan(2);
  taskify.run('a').once('complete', function(err) {
    t.ifError(err, 'no error');
    t.deepEqual(executed, ['c', 'b', 'a']);
  });
});

test('reject cyclic dependency (c --> c)', function(t) {
  c.depends('c');
  executed = [];

  t.plan(2);
  taskify.run('a').once('complete', function(err) {
    t.ifError(err, 'no error');
    t.deepEqual(executed, ['c', 'b', 'a']);
  });
});

/*
// TODO
test('reject cyclic dependency (c --> a)', function(t) {
  c.depends('a');
  executed = [];

  t.plan(2);
  taskify.run('a').once('complete', function(err) {
    t.ifError(err, 'no error');
    t.deepEqual(executed, ['c', 'b', 'a']);
  });
});*/