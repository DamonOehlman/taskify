var assert = require('assert'),
    tako = require('tako'),
    task = require('../'),
    request = require('request'),
    app = tako();

describe('http server PoC tests', function() {
    before(task.reset);

    after(function(done) {
        app.httpServer.close(done);
    });

    it('should be able to define a task handling requests', function() {
        task('sayHello', function(req, res) {
            res.end('hi');
        });
    });

    it('should be able to register a tako handler for the task', function() {
        app.route('/hi', task.selectStrict('sayHello')).methods('GET');
    });

    it('should be able to set the server running', function(done) {
        app.httpServer.listen(3000, done);
    });

    it('should be able to get the response from the task', function(done) {
        request.get('http://localhost:3000/hi', function(err, res, body) {
            assert.ifError(err);
            assert.equal(body, 'hi');

            done();
        });
    });

    it('should be able to define a series of tasks that will participate in the request', function() {
        task('second', ['first'], function(req, res) {
            res.end('2');
        });

        task('first', function(req, res) {
            res.write('1');
        });

        app.route('/12', task.selectStrict('second')).methods('GET');
    });

    it('should be able to get the combined response from the tasks', function(done) {
        request.get('http://localhost:3000/12', function(err, res, body) {
            assert.ifError(err);
            assert.equal(body, '12');

            done();
        });
    });

    it('should be able to define a task that receives additional arguments on selection', function() {
        task('third', function(name, req, res) {
            res.end(name);
        });

        app.route('/3', task.selectStrict('third', 'bob')).methods('GET');
    });

    it('should be able to get the name bob on response', function(done) {
        request.get('http://localhost:3000/3', function(err, res, body) {
            assert.ifError(err);
            assert.equal(body, 'bob');

            done();
        });
    });
});