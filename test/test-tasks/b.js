task('b', ['a'], function() {
    this.context.data = (this.context.data || []).concat('b');
});