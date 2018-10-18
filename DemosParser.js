const codeBlockPtrn = '```(\\w*?)\\n((?:.|\\n)*?)```';
const fileNamePtrn = '(?:_(.+)_\\n)?';
const docImportPtrn = /(["'])doc\/([\w\.]+)\1/g;

const escapeRegexp = str => str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

const replaceImports = (resourcePath, demoContent) => demoContent.replace(
	docImportPtrn,
	match => match.replace('doc/', `${resourcePath}?mdvue-file=`)
);

class DemosParser {
	constructor({ markdownSrc, resourcePath }) {
		this.markdownSrc = markdownSrc;
		this.resourcePath = resourcePath;
	}

	getImportingFiles(demoSrc) {
		const files = [];
		demoSrc.replace(docImportPtrn, (_, q, fileName) => files.push(fileName));
		return files;
	}

	gatherRelatedFiles(demoSrc) {
		const queue = [demoSrc];
		const files = [{ src: demoSrc }];
		while (queue.length) {
			const fileSrc = queue.shift();
			const importing = this.getImportingFiles(fileSrc);

			importing.forEach((fileName) => {
				const fileSrc = this.findDemoByFileName(fileName);
				files.push({
					name: fileName,
					src: fileSrc,
				});
				queue.push(fileSrc);
			});
		}

		return files;
	}

	replaceDemos({ ignoreNamed }, cb) {
		let idx = 0;

		const re = new RegExp(fileNamePtrn + codeBlockPtrn, 'g');
		return this.markdownSrc.replace(
			re,
			(fullMatch, fileName, codeType, demoSrc) => {
				if (ignoreNamed && fileName) { return ''; }

				const files = this.gatherRelatedFiles(demoSrc);
				return cb(fullMatch, idx++, fileName, codeType, files);
			}
		);
	}

	findDemoByIdx(idx) {
		const re = new RegExp(fileNamePtrn + codeBlockPtrn, 'g');

		let n = 0;
		let demo;
		while ((demo = re.exec(this.markdownSrc)) !== null) {
			const [fullMatch, fileName, codeType, code] = demo;
			if (fileName) { continue; }

			if (n === idx) {
				return this.resourcePath ? replaceImports(this.resourcePath, code) : code;
			}
			n++;
		}

		throw new Error(`Couldn't find demo at idx '${n}'`);
	}

	findDemoByFileName(fileName) {
		const escapedName = escapeRegexp(`_${fileName}_`);
		const pattern = new RegExp(`${escapedName}\\n${codeBlockPtrn}`);
		const found = this.markdownSrc.match(pattern);

		if (!found) {
			throw new Error(`Couldn't find demo with name '${fileName}'`);
		}

		return this.resourcePath ? replaceImports(this.resourcePath, found[2]) : found[2];
	}
}

module.exports = DemosParser;
