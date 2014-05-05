When running a task using the `task.run` function (or by running the
bound function returned from a `task.select`) call, you can supply
arguments that will be passed to that task handler **and** all precondition
tasks.

As an example, let's pass `console.log` as a task handler:

```js
task('log', console.log);
```

And then run the task passing through the message arguments:

```js
task.run('log', 'Hi there', { test: true });
```

This would generate the following output:

```
Hi there { test: true }
```
