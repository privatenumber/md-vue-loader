const markdownIt = require('markdown-it');
const outdent = require('outdent');
const DemosParser = require('./DemosParser');
const hash = require('hash-sum');

class MdVue {
	constructor({ markdownSrc, resourcePath, buildDemos }) {
		this.markdownSrc = markdownSrc;
		this.importStmts = new Set();
		this.components = new Set();
		this.resourcePath = resourcePath;
		this.buildDemos = buildDemos;
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

				let demoTag = `<${compName} />`;
				if (typeof this.buildDemos === 'function') {
					demoTag = this.buildDemos.call(this, demoTag, files);
				}

				const key = hash(demoTag);
				this.vueComponentInsertions.set(key, demoTag);
				return `\n${key}\n`;
			}
		);
	}

	toString() {
		if (this.buildDemos) {
			this.extractDemos();
		}

		let markdownHtml = markdownIt({ html: true }).render(this.markdownSrc);

		if (this.vueComponentInsertions) {
			this.vueComponentInsertions.forEach((val, key) => {
				markdownHtml = markdownHtml.replace(`<p>${key}</p>`, val);
			});
		}

		const importStmts = Array.from(this.importStmts).join('\n');

		return outdent`
			<template>
				<div class="markdown">${markdownHtml}</div>
			</template>
			<script>
			${importStmts}

			export default {
 				components: { ${Array.from(this.components)} }
			};
			</script>
		`;
	}
}

module.exports = MdVue;
