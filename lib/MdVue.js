const markdownIt = require('markdown-it');
const outdent = require('outdent');
const DemosParser = require('./DemosParser');
const hash = require('hash-sum');
const escapeVueChars = string => string.replace(/([<>{}])/g, (_, c) => `<span>${c}</span>`);

class MdVue {
	constructor({
		markdownSrc,
		resourcePath,
		buildDemos,
		useVOnce,
		markdownItOpts,
		markdownItPlugins,
		markdownCSS,
	}) {
		this.markdownSrc = markdownSrc;
		this.importStmts = new Set();
		this.components = new Set();
		this.useVOnce = useVOnce;
		this.resourcePath = resourcePath;
		this.buildDemos = buildDemos;
		this.markdownItOpts = markdownItOpts;
		this.markdownItPlugins = markdownItPlugins;
		this.markdownCSS = markdownCSS;
	}

	addComponent(varName, compPath) {
		this.importStmts.add(`import ${Array.isArray(varName) ? `{${varName}}` : varName} from '${compPath}';`);

		if (Array.isArray(varName)) {
			varName.forEach(name => this.components.add(name));
		} else {
			this.components.add(varName);
		}
	}

	extractDemos() {
		const demos = new DemosParser({
			markdownSrc: this.markdownSrc
		});
		this.vueComponentInsertions = new Map(); // Post-insertion
		this.markdownSrc = demos.replaceDemos(
			{ ignoreNamed: true },
			(fullMatch, idx, fileName, codeType, files) => {
				if (codeType !== 'vue') {
					return fullMatch;
				}

				const compName = `Demo${idx}`;
				this.addComponent(compName, `${this.resourcePath}?mdvue-demo=${idx}`);

				const demoTag = `<${compName} />`;
				const placeholder = hash(demoTag);
				this.vueComponentInsertions.set(placeholder, {
					demoTag,
					files,
				});
				return `\n${placeholder}\n`;
			}
		);
	}

	toString() {
		if (this.buildDemos) {
			this.extractDemos();
		}

		const md = markdownIt({
			...this.markdownItOpts,
			highlight: !this.buildDemos && ((code, type) => escapeVueChars(code)),
		});

		if (Array.isArray(this.markdownItPlugins)) {
			this.markdownItPlugins.forEach(([plugin, opts]) => {
				md.use(plugin, opts);
			});
		}

		let markdownHtml = md.render(this.markdownSrc);

		if (this.vueComponentInsertions) {
			this.vueComponentInsertions.forEach(({ demoTag, files }, placeholder) => {

				if (typeof this.buildDemos === 'function') {
					demoTag = this.buildDemos.call(this, demoTag, files);
				}

				markdownHtml = markdownHtml.replace(`<p>${placeholder}</p>`, `<div>${demoTag}</div>`);
			});
		}

		const importStmts = Array.from(this.importStmts).join('\n');

		return outdent`
			<template>
				<div class="markdown-body" ${this.useVOnce ? 'v-once' : ''}>${markdownHtml}</div>
			</template>
			<script>
			${importStmts}

			export default {
 				components: { ${Array.from(this.components)} }
			};
			</script>

			${this.markdownCSS ? `<style scoped>${this.markdownCSS}</style>` : ''}
		`;
	}
}

module.exports = MdVue;
