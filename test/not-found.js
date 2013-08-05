var test = require('tape');
var taskify = require('..');

test('reset', function(t) {
  t.plan(1);
  t.ok(taskify.reset(), 'reset ok');
});

test('cannot find a', function(t) {
  t.plan(1);
  t.notOk(taskify.get('a'), 'could not find a, as expected');
});

test('running non-existant task returns an error', function(t) {
  t.plan(1);
  taskify.run('a').once('complete', function(err) {
    t.ok(err instanceof Error, 'received expected error attempting to run a');
  });
});