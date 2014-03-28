var test = require('tape');
var task = require('..')();

test('cannot find a', function(t) {
  t.plan(1);
  t.notOk(task.get('a'), 'could not find a, as expected');
});

test('running non-existant task returns an error', function(t) {
  t.plan(1);
  task.run('a').once('complete', function(err) {
    t.ok(err instanceof Error, 'received expected error attempting to run a');
  });
});