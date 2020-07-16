const markdownIt = require('markdown-it');
const outdent = require('outdent');

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
		highlight: !buildDemos && (code => escapeVueChars(code)),
	});

	if (Array.isArray(markdownItPlugins)) {
		markdownItPlugins.forEach(([plugin, options]) => {
			if (plugin) {
				mdi.use(plugin, options);
			}
		});
	}

	let options;
	if (buildDemos) {
		options = {
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

						if (this.importStatements.includes(importStmt)) {
							return;
						}

						this.importStatements.push(importStmt);

						if (Array.isArray(varName)) {
							varName.forEach(name => this.components.push(name));
						} else {
							this.components.push(varName);
						}
					},
				},
			},
		};
		mdi.use(extractDemosPlugin, options);
	}

	const markdownHtml = mdi.render(markdownSrc);
	let content = outdent`
		<template>
			<div class="markdown-body" ${useVOnce ? 'v-once' : ''}>${markdownHtml}</div>
		</template>
	`;

	if (options) {
		content += outdent`
			<script>
			${options.output && options.output.entryFile.importStatements.join('\n')}

			export default {
				components: { ${options.output.entryFile.components} }
			};
			</script>
		`;
	}

	if (markdownCSS) {
		content += outdent`
			<style scoped>${markdownCSS}</style>
		`;
	}

	return {
		content,
		snippets: options && options.output.snippets,
	};
}

module.exports = buildMd;
