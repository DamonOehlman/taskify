__NOTE:__ From the `2.0` release of taskify has been redesigned to isolate
the task registry into well defined scopes.  As such a new _instance_ of
taskify needs to be created when requiring the module.

The first step with using taskify is to require the module and create a
new task registry scope:

```js
var task = require('taskify')();
```

Then you can start defining tasks:

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
