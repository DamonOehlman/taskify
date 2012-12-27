var path = require('path');

module.exports = function() {
    this.context.data = (this.context.data || []).concat('a');
};