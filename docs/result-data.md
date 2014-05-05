When you call the `task.run` function, Taskify creates a
new [ExecutionContext](/context.js) for the task dependency tree that will
be executed.  This execution context is not persistent though and only
lasts until the requested tasks have completed their execution (or you
capture the reference).

To capture the results of a task execution you will need to handle the
complete event for a particular task.  Let's look at the simple example of
our `load-data` task from before:

```js
task.run('load-data').on('complete', function(err) {
  if (err) return;

  console.log('loaded data: '  + this.context.results['load-data']);
});
```

Additionally, because Taskify uses
[eve](https://github.com/DmitryBaranovskiy/eve) under the hood for eventing,
you can implement eve handlers to capture the complete events also:

```js
eve.on('taskify.complete.load-data', function(err) {
  if (err) return;

  console.log('loaded data: '  + this.context.results['load-data']);
});
```
