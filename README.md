# Taskify

This is a simple task execution helper that is heavily influenced from [jake](https://github.com/mde/jake) and [grunt](https://github.com/gruntjs/grunt).  It's kind of like jake but without the build goodies, and designed to work in the browser as well as node.

## Example Usage

Define a task `a`:

```js
task('a', function() {
    console.log('a'); 
});
```

Then define another task that relies on task `a`:

```js
task('b', ['a'], function() {
    console.log('b'); 
});
```

Run task b:

```js
task.run('b');
```

Which would generate the following output:

```
a
b
```

## Asynchronous Behaviour

Specifying that a task handler behaves asynchronously is very similar to the way you would do this in a grunt task:

```js
task('c', function() {
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
task('load-data', function() {
    fs.readFile(path.resolve('data.txt'), 'utf8', this.async()); 
});
```