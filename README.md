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

When you call the `taskify.run` function, Taskify creates a new [ExecutionContext](https://github.com/DamonOehlman/taskify/blob/master/src/core/context.js) for the task dependency tree that will be executed.  This execution context is not persistent though and only lasts until the requested tasks have completed their execution (or you capture the reference).

To capture the results of a task execution you will need to handle the complete event for a particular task.  Let's look at the simple example of our `load-data` task from before:

```js
taskify.run('load-data').on('complete', function(err) {
    if (err) return;

    console.log('loaded data: '  + this.context.results['load-data']); 
});
```

Additionally, because Taskify uses [eve](https://github.com/DmitryBaranovskiy/eve) under the hood for eventing, you can implement eve handlers to capture the complete events also:

```js
eve.on('taskify.complete.load-data', function(err) {
    if (err) return;

    console.log('loaded data: '  + this.context.results['load-data']); 
});
```

## Argument Passing

When running a task using the `taskify.run` function (or by running the bound function returned from a `taskify.select`) call, you can supply arguments that will be passed to that task handler **and** all precondition tasks.

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

## Using the Task Loader (Node Only)

To help structure task oriented applications, taskify supports a `loadTasks` function when used in node.  To use this function simply create a folder that you will use to define your tasks in (only single level supported at this stage).

Within this folder, create modules that define the task functionality.  For example, if we were to create file `a.js` in the folder `tasks/` with the following content:

```js
module.exports = function() {
    console.log('Hi from a');
}
```

And then `b.js` in the same folder, but this time we want to define a dependency on task `a` from `b`:

```js
var runner = module.exports = function() {
    console.log('Hi from b');
};

runner.deps = ['a'];
```

We could then load the tasks using the load tasks function, and then run task b:

```js
var taskify = require('taskify'),
    path = require('path');

taskify.loadTasks(path.resolve(__dirname, 'tasks'));
taskify.run('b');
```

Would generate the following output:

```
Hi from a
Hi from b
```

## Experimental Use Case: Handling HTTP Requests without Middleware

While this was not one of the reasons I created Taskify, it is something I experimented with as a way of resolving preconditions for a particular route handler.  While most web frameworks implement middleware to handle things like cookie or body parsing Taskify can offer an alternative approach.

For instance, consider the following example implementing using [Tako](https://github.com/mikeal/tako). The example defines an `auth` task that can be specified as a precondition for a task that would require user awareness.  

The great thing here is that the execution path for a simple request handler does not need to be passed through unnecessary middleware, but only through tasks that have been specifically defined as preconditions (or preconditions of preconditions) of the route handler.

```js
var tako = require('tako'),
    taskify = require('taskify'),
    app = tako(),
    knownUsers = {
        DamonOehlman: {
            name: 'Damon Oehlman',
            twitterHandle: 'DamonOehlman'
        }
    };

// define the authenticator task
taskify('auth', function(req, res) {
    // inspect the req headers
    var userId = req.headers['x-user-id'];

    // check that the user is within the list of know 
    if (! knownUsers[userId]) return new Error('A known user is required');

    // add the user to the context
    this.context.user = knownUsers[userId];
});

// define a task that tells us the twitter handle of the user
taskify('writeHandle', ['auth'], function(req, res) {
    res.end(this.context.user.twitterHandle);
});

// define a task that says hi
taskify('sayHi', function(req, res) {
    res.end('hi');
});

taskify('reportError', function(req, res) {
    res.end('error: ' + this.context.errors[0].message);
});

// set the default fallback
taskify.defaults({
    fallback: 'reportError'
});

// wire up the application routes
app.route('/hi', taskify.select('sayHi'));
app.route('/handle', taskify.select('writeHandle'));

// start the server
app.httpServer.listen(3000);
```

Something to note is that the above example makes use of the `taskify.select` function which returns a function reference that can be used to execute the task.  The arguments passed to this function reference are then passed through to all the task runners.  In this way it is fairly simple to use Taskify to handle http requests using most lightweight node web frameworks.