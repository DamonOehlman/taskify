var assert = require('assert'),
    tako = require('tako'),
    task = require('../'),
    request = require('request'),
    app = tako();

describe('http server PoC tests', function() {
    it('should be able to define a task handling requests', function() {
        task('sayHello', function(req, res) {
            res.end('hi');
        });
    });

    it('should be able to register a tako handler for the task', function() {
        app.route('/hi', task.select('sayHello')).methods('GET');
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
});