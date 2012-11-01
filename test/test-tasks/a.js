var path = require('path');

task('a', function() {
    this.context.data = (this.context.data || []).concat('a');
});