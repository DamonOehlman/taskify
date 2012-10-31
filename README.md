# Taskify

This is a simple task execution helper that is heavily influenced from [jake](https://github.com/mde/jake) and [grunt](https://github.com/gruntjs/grunt).  It's kind of like jake but without the build goodies, and designed to work in the browser as well as node.

<a href="http://travis-ci.org/#!/DamonOehlman/taskify"><img src="https://secure.travis-ci.org/DamonOehlman/taskify.png" alt="Build Status"></a>

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

Specifying that a task handler behaves asynchronously is very similar to the way you would do this in a grunt task:

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

When you call the `taskify.run` function, Taskify it creates a new [ExecutionContext](https://github.com/DamonOehlman/taskify/blob/master/src/core/context.js) for the task dependency tree that will be executed.  This execution context is not persistent though and only lasts until the requested tasks have completed their execution (or you capture the reference).

To capture the results of a task execution you will need to handle the complete event for a particular task.  Let's look at the simple example of our `load-data` task from before:

```js
taskify.run('load-data').on('complete', function(err) {
    if (err) return;

    console.log('loaded data: '  + this.context.results['load-data']); 
});
```

Additionally, because Taskify uses [eve](https://github.com/DmitryBaranovskiy/eve) under the hood for eventing, you can implement eve handlers to capture the complete events also:

```js
eve.on('task.complete.load-data', function(err) {
    if (err) return;

    console.log('loaded data: '  + this.context.results['load-data']); 
});
```

__NOTE:__ The eve namespace for events is `task.` rather than `taskify.` as usually I find mapping to task requires a little less typing.  Additionally, I usually do something like `var task = require('taskify');`...