const documentImportPtrn = /(["'])doc\/([\w.]+)\1/g;

const rewriteImports = (resourcePath, src) => src.replaceAll(
	documentImportPtrn,
	match => match.replace('doc/', `${resourcePath}?mdvue-file=`),
);

const getImportingFiles = (src) => {
	const files = [];
	src.replaceAll(documentImportPtrn, (_, q, fileName) => files.push(fileName));
	return files;
};

const gatherRelatedFiles = (file, namedObject) => {
	const queue = [file.content];
	const files = [file];
	while (queue.length > 0) {
		const fileSrc = queue.shift();
		const importing = getImportingFiles(fileSrc);

		importing.forEach((name) => {
			const namedDemo = namedObject[name];
			files.push(namedDemo);
			queue.push(namedDemo.content);
		});
	}

	return files;
};

const getName = (array, i) => {
	const nameToken = array[i - 2];

	if (
		nameToken.type === 'inline'
		&& nameToken.children[0].markup === '_'
		&& nameToken.children[2].markup === '_'
	) {
		return nameToken.children[1].content;
	}

	return null;
};

const extractDemos = (md, options) => {
	if (!options) {
		return;
	}

	const { output, resourcePath, transformEntry } = options;

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

		output.snippets.entry.forEach((file, index) => {
			const componentName = `Demo${index}`;
			output.entryFile.addComponent(
				componentName,
				`${resourcePath}?mdvue-demo=${index}`,
			);

			let entryInline = `<${componentName}/>`;
			const relatedFiles = gatherRelatedFiles(file, output.snippets.named);

			if (transformEntry) {
				entryInline = transformEntry.call(output.entryFile, entryInline, relatedFiles);
			}

			relatedFiles.forEach((relatedFile) => {
				relatedFile.content = rewriteImports(resourcePath, relatedFile.content);
			});

			file.token.content = entryInline;
		});
	});
};

module.exports = extractDemos;
