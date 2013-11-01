var firetruck = require('firetruck');
var taskify = require('..');
var http = require('http');
var app = firetruck();
var eve = require('eve');
var knownUsers = {
  DamonOehlman: {
    name: 'Damon Oehlman',
    twitterHandle: 'DamonOehlman'
  }
};
var server;

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

app('/hi', taskify.select('sayHi'));
app('/handle', taskify.select('writeHandle'));

// create teh server
server = http.createServer();

// start the server
app.attach(server);
server.listen(3000);