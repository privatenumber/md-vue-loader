const markdownIt = require('markdown-it');
const outdent = require('outdent');
const DemosParser = require('./DemosParser');
const hash = require('hash-sum');
const escapeVueChars = string => string.replace(/([<>{}])/g, (_, c) => `<span>${c}</span>`);
const extractDemosPlugin = require('./extract-demos-plugin');

function buildMd({
	markdownSrc,
	resourcePath,
	buildDemos,
	useVOnce,
	markdownItOpts,
	markdownItPlugins,
	markdownCSS,
}) {
	const mdi = markdownIt({
		...markdownItOpts,
		highlight: !buildDemos && ((code, type) => escapeVueChars(code)),
	});

	if (Array.isArray(markdownItPlugins)) {
		markdownItPlugins.forEach(([plugin, opts]) => {
			if (plugin) {
				mdi.use(plugin, opts);
			}
		});
	}


	let opts;
	if (buildDemos) {
		opts = {
			transformEntry: typeof buildDemos === 'function' && buildDemos,
			resourcePath,
			output: {
				snippets: {
					entry: [],
					named: {},
				},
				entryFile: {
					importStatements: [],
					components: [],
					addComponent(varName, compPath) {
						const importStmt = `import ${Array.isArray(varName) ? `{${varName}}` : varName} from '${compPath}';`;

						if (this.importStatements.includes(importStmt)) { return; }

						this.importStatements.push(importStmt);

						if (Array.isArray(varName)) {
							varName.forEach(name => this.components.push(name));
						} else {
							this.components.push(varName);
						}
					}
				},
			},
		};
		mdi.use(extractDemosPlugin, opts);
	}

	const markdownHtml = mdi.render(markdownSrc);
	const content = outdent`
		<template>
			<div class="markdown-body" ${ useVOnce ? 'v-once' : '' }>${ markdownHtml }</div>
		</template>
		<script>
		${ opts.output.entryFile.importStatements.join('\n') }

		export default {
			components: { ${ opts.output.entryFile.components } }
		};
		</script>

		${ markdownCSS ? `<style scoped>${markdownCSS}</style>` : '' }
	`;

	return {
		content,
		snippets: opts.output.snippets,
	};
}

module.exports = buildMd;
