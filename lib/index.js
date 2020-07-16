const loaderUtils = require('loader-utils');
const hash = require('hash-sum');
const buildMd = require('./build-md');

const notFound = name => `<script>throw new Error('"${name}" not found');</script>`;

const cache = new Map();

module.exports = function MDVueLoader(markdownSrc) {
	const options = loaderUtils.getOptions(this);
	const key = hash(markdownSrc + JSON.stringify(options));

	let built = cache.get(key);
	if (!built) {
		built = buildMd({
			...options,
			useVOnce: this._compiler.options.mode === 'production',
			markdownSrc,
			resourcePath: this.resourcePath,
		});
	}

	const parameters = this.resourceQuery ? loaderUtils.parseQuery(this.resourceQuery) : {};

	if (parameters.hasOwnProperty('mdvue-demo')) {
		const {'mdvue-demo': idx} = parameters;
		const file = built.snippets.entry[idx];
		return file ? file.content : notFound(`Demo ${idx}`);
	}

	if (parameters.hasOwnProperty('mdvue-file')) {
		const {'mdvue-file': name} = parameters;
		const file = built.snippets.named[name];
		return file ? file.content : notFound(`Demo ${name}`);
	}

	return built.content;
};
