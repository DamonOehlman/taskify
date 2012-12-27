var runner = module.exports = function() {
	console.log('Hi from b');
};

runner.deps = ['a'];