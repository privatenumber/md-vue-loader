const markdownIt = require('markdown-it');
const outdent = require('outdent');
const hash = require('hash-sum');
const demoSelectorLoader = require.resolve('./demo-selector');

const vueCodeBlockPtrn = '```vue\\n((?:.|\\n)*?)```';

const vueLoader = require.resolve('vue-loader');
function genImportStmt(compName, idx) {
	return `import ${compName} from '!!${vueLoader}!${demoSelectorLoader}?idx=${idx}!${this.resourcePath}';`;
}

const cache = new Map();

function MDVueLoader(src) {
	console.log('mdvue-loader from', this.resourcePath, this.resourceQuery);
	const key = hash(src);
	if (cache.has(key)) {
		return cache.get(key);
	}

	const demoTags = [];
	src = src.replace(new RegExp(vueCodeBlockPtrn, 'g'), () => {
		const demoName = `Demo${demoTags.length}`;
		demoTags.push(demoName);
		return `<${demoName} />`;
	});

	const markdownHtml = markdownIt({ html: true }).render(src);

	const output = outdent`
		<template>
			<div class="markdown">${markdownHtml}</div>
		</template>
		<script>
		${demoTags.map(genImportStmt.bind(this)).join('')}
		// console.log(2, Demo0.render.toString());
		export default {
			components: { ${demoTags} },
		};
		</script>
	`;
	// console.log(output)
	cache.set(key, output);

	return output;
};

module.exports = MDVueLoader;
