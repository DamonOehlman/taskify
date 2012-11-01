var test = require('./dummy/test');

var task = module.exports = function() {
    this.context.data = (this.context.data || []).concat('b');
};

task.deps = ['a'];