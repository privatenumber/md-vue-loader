const loaderUtils = require('loader-utils');
const hash = require('hash-sum');
const buildMd = require('./build-md');

const notFound = (name) => `<script>throw new Error('"${name}" not found');</script>`;

const cache = new Map();

module.exports = function MDVueLoader(markdownSrc) {
	const opts = loaderUtils.getOptions(this);
	const key = hash(markdownSrc + JSON.stringify(opts));

	let built = cache.get(key);
	if (!built) {
		built = buildMd({
			...opts,
			useVOnce: this._compiler.options.mode === 'production',
			markdownSrc,
			resourcePath: this.resourcePath,
		});
	}

	const params = this.resourceQuery ? loaderUtils.parseQuery(this.resourceQuery) : {};

	if (params.hasOwnProperty('mdvue-demo')) {
		const { 'mdvue-demo': idx } = params;
		const file = built.snippets.entry[idx];
		return file ? file.content : notFound(`Demo ${idx}`);
	}

	if (params.hasOwnProperty('mdvue-file')) {
		const { 'mdvue-file': name } = params;
		const file = built.snippets.named[name];
		return file ? file.content : notFound(`Demo ${name}`);
	}

	return built.content;
};
