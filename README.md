# Taskify

This is a simple task execution helper that is heavily influenced from
[jake](https://github.com/mde/jake) and
[grunt](https://github.com/gruntjs/grunt).  It's kind of like jake but
without the build goodies, and designed to work in the browser as well
as node.

## Example Usage

Define a task `a`:

```js
taskify('a', function() {
  console.log('a');
});
```

Then define another task that relies on task `a`:

```js
taskify('b', ['a'], function() {
  console.log('b');
});
```

Run task b:

```js
taskify.run('b');
```

Which would generate the following output:

```
a
b
```

## Asynchronous Behaviour

Specifying that a task handler behaves asynchronously is very similar to
the way you would do this in a grunt task:

```js
taskify('c', function() {
  // call the async method of the task (passed to the runner as this)
  var done = this.async();

  // when the task has been completed call done
  // the first argument is reserved for an error (if one occured)
  // and subsequent arguments will be placed on the context.results object
  setTimeout(function() {
    done();
  }, 1000);
});
```

Or a slightly less contrived example:

```js
taskify('load-data', function() {
  fs.readFile(path.resolve('data.txt'), 'utf8', this.async());
});
```

## Capturing Result Data

When you call the `taskify.run` function, Taskify creates a
new [ExecutionContext](/context.js) for the task dependency tree that will 
be executed.  This execution context is not persistent though and only
lasts until the requested tasks have completed their execution (or you
capture the reference).

To capture the results of a task execution you will need to handle the
complete event for a particular task.  Let's look at the simple example of
our `load-data` task from before:

```js
taskify.run('load-data').on('complete', function(err) {
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

## Argument Passing

When running a task using the `taskify.run` function (or by running the
bound function returned from a `taskify.select`) call, you can supply
arguments that will be passed to that task handler **and** all precondition
tasks.

As an example, let's pass `console.log` as a task handler:

```js
taskify('log', console.log);
```

And then run the task passing through the message arguments:

```js
taskify.run('log', 'Hi there', { test: true });
```

This would generate the following output:

```
Hi there { test: true }
```

## Taskify Reference

### taskify(name, opts, runner)

### taskify.defaults

Update the defaults for taskify

### taskify.get

Get a task by name

### taskify.prepare

Prepare task(s) to execute, returning a function that will accept arguments
that will be passed through to the tasks

### taskify.select

The select function passes control through to the `taskify.prepare`
function, but only once it has validated that task dependencies have been
satisfied.  If dependencies cannot be satisfied then an Error will
be thrown.

### taskify.reset

Reset the registry - clear existing task definitions.

### taskify.run

## ExecutionContext

### exec(task, atgs)

Execute the specified task passing the args to the runner

## TaskDefinition

### depends(names)

### isValid(missingDeps)

The valid method looks for the dependencies of the task and attempts to 
retrieve them from the taskify registry.  If all dependencies are resolved,
`isValid` will return true, or false if not.

If the method is provided an array for the missingDeps argument, unresolved
task names will be pushed onto the array and can be accessed for diagnosis
of the error.

### unresolved()

Return the names of any unresolved dependencies

## TaskProxy

The TaskProxy provides access to the TaskDefinition information but
provides state isolation during task execution.

### async()

Specify that the task should execute asynchronously

### complete(err)

### @id

The id property is used to return the unique id for the task proxy.  The id
is the initially generated combined prefixed with the definition name.
For instance if the TaskDefinition name is `test` and the `_id` generated
for the proxy is 1, then the `id` property will return `test.1`

### @fallback

Return the fallback task specified in the task definition

### @name

The name property is used to proxy the definition name to the proxy

### @promise

The promise property allows tasks to operate seamlessly within a promises
implementation.  At this stage taskify looks to use `Q` by default, but can 
also work with other promise implementations that implement a 
`<packagename>.defer()` function as a way of creating a new Deferred
instance (such as [when.js](https://github.com/cujojs/when)).

To update taskify to use a library other than the default of `Q` simply
update the taskify defaults::

```js
taskify.defaults({
  promiseLib: 'when'
});
```

## registry

### registry.get(name)

### registry.missing(name)

Return whether or not the task is missing from the registry

### registry.put(name, definition)

### registry.reset()
