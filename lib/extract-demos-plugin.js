const docImportPtrn = /(["'])doc\/([\w\.]+)\1/g;

const rewriteImports = (resourcePath, src) => src.replace(
	docImportPtrn,
	(match) => match.replace('doc/', `${resourcePath}?mdvue-file=`),
);

const getImportingFiles = (src) => {
	const files = [];
	src.replace(docImportPtrn, (_, q, fileName) => files.push(fileName));
	return files;
};

const gatherRelatedFiles = (file, namedObj) => {
	const queue = [file.content];
	const files = [file];
	while (queue.length) {
		const fileSrc = queue.shift();
		const importing = getImportingFiles(fileSrc);

		importing.forEach((name) => {
			const namedDemo = namedObj[name];
			files.push(namedDemo);
			queue.push(namedDemo.content);
		});
	}

	return files;
};

const getName = (arr, i) => {
	const nameToken = arr[i - 2];

	if (
		nameToken.type === 'inline'
		&& nameToken.children[0].markup === '_'
		&& nameToken.children[2].markup === '_'
	) {
		return nameToken.children[1].content;
	}
	return null;
};

const extractDemos = (md, opts) => {
	if (!opts) {
		return;
	}

	const { output } = opts;

	md.core.ruler.push('add-vue-demos', (state) => {
		const { tokens } = state;

		for (let i = 0; i < tokens.length; i += 1) {
			const token = tokens[i];

			if (token.type !== 'fence' || token.info !== 'vue') {
				continue;
			}

			let removeFrom = i;
			let removeTokens = 1;
			const replaceWith = [];

			const { content } = token;
			const name = getName(tokens, i);

			if (name) {
				output.snippets.named[name] = { name, content };
				removeFrom -= 3;
				removeTokens += 3;
				i -= 4;
			} else {
				const htmlToken = Object.assign(new state.Token('html_block', '', 0), { content });
				replaceWith.push(htmlToken);
				output.snippets.entry.push({
					content,
					token: htmlToken,
				});
			}

			// Remove or replace code snippet with demo
			tokens.splice(removeFrom, removeTokens, ...replaceWith);
		}

		output.snippets.entry.forEach((file, idx) => {
			const componentName = `Demo${idx}`;
			output.entryFile.addComponent(componentName, `${opts.resourcePath}?mdvue-demo=${idx}`);

			let entryInline = `<${componentName}/>`;
			const relatedFiles = gatherRelatedFiles(file, output.snippets.named);

			if (opts.transformEntry) {
				entryInline = opts.transformEntry.call(output.entryFile, entryInline, relatedFiles);
			}

			relatedFiles.forEach((relatedFile) => {
				relatedFile.content = rewriteImports(opts.resourcePath, relatedFile.content);
			});

			file.token.content = entryInline;
		});
	});
};

module.exports = extractDemos;
