var test = require('async');

var task = module.exports = function() {
    this.context.data = (this.context.data || []).concat('c');
};

task.deps = ['a'];