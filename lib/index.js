const loaderUtils = require('loader-utils');
const hash = require('hash-sum');
const hasOwnProp = require('has-own-prop');
const buildMd = require('./build-md');

const notFound = name => `<script>throw new Error('"${name}" not found');</script>`;

const cache = new Map();

function MdVueLoader(markdownSrc) {
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

	if (hasOwnProp(parameters, 'mdvue-demo')) {
		const {'mdvue-demo': idx} = parameters;
		const file = built.snippets.entry[idx];
		return file ? file.content : notFound(`Demo ${idx}`);
	}

	if (hasOwnProp(parameters, 'mdvue-file')) {
		const {'mdvue-file': name} = parameters;
		const file = built.snippets.named[name];
		return file ? file.content : notFound(`Demo ${name}`);
	}

	return built.content;
}

module.exports = MdVueLoader;
