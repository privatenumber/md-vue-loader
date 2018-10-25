const loaderUtils = require('loader-utils');
const hash = require('hash-sum');
const DemosParser = require('./DemosParser');
const MdVue = require('./MdVue');

const cache = new Map();

module.exports = function MDVueLoader(markdownSrc) {
	const params = this.resourceQuery ? loaderUtils.parseQuery(this.resourceQuery) : {};

	if (params.hasOwnProperty('mdvue-demo') || params.hasOwnProperty('mdvue-file')) {
		const demos = new DemosParser({
			markdownSrc,
			resourcePath: this.resourcePath,
		});

		if (params.hasOwnProperty('mdvue-demo')) {
			return demos.findDemoByIdx(+params['mdvue-demo']);
		}

		if (params.hasOwnProperty('mdvue-file')) {
			return demos.findDemoByFileName(params['mdvue-file']);
		}
	}

	const opts = loaderUtils.getOptions(this);
	const key = hash(markdownSrc + JSON.stringify(opts));

	if (cache.has(key)) {
		return cache.get(key);
	}

	const compiler = new MdVue({
		...opts,
		useVOnce: this._compiler.options.mode === 'production',
		markdownSrc,
		resourcePath: this.resourcePath,
	});

	const compiled = compiler.toString();

	cache.set(key, compiled);

	return compiled;
};
