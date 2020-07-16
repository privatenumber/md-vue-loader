const mdvueLoaderPath = require.resolve('..');

const outdent = require('outdent');
const webpack = require('webpack');
const MemoryFS = require('memory-fs');
const fs = require('fs');
const {ufs} = require('unionfs');
const VueLoaderPlugin = require('vue-loader/lib/plugin');

const Vue = require('vue');

function build(input, loaderConfig = {}) {
	return new Promise((resolve, reject) => {
		const mfs = new MemoryFS();

		mfs.writeFileSync('/entry.md', input);

		const compiler = webpack({
			mode: 'development',
			resolveLoader: {
				alias: {
					'md-vue-loader': mdvueLoaderPath,
				},
			},
			module: {
				rules: [
					{
						test: /\.vue$/,
						loader: 'vue-loader',
					},
					{
						test: /\.md$/,
						use: [
							'vue-loader',
							{
								loader: 'md-vue-loader',
								options: loaderConfig,
							},
						],
						// TODO: Eventually support
						// Currently can't because vue-loader doesn't support
						// oneOf: [
						// 	{
						// 		resourceQuery: /codeType=vue/,
						// 		loader: 'vue-loader',
						// 		enforce: 'post',
						// 	},
						// 	{
						// 		use: [
						// 			'vue-loader',
						// 			{
						// 				loader: 'md-vue-loader',
						// 				options: {}
						// 			},
						// 		],
						// 	},
						// ],
					},
				],
			},
			plugins: [
				new VueLoaderPlugin(),
			],
			entry: '/entry.md',
			output: {
				path: '/',
				filename: 'test.build.js',
			},
		});

		compiler.inputFileSystem = ufs.use(fs).use(mfs);
		compiler.outputFileSystem = mfs;

		compiler.run((err, stats) => {
			if (err) {
				reject(err);
				return;
			}

			if (stats.compilation.errors.length > 0) {
				reject(stats.compilation.errors);
				return;
			}

			resolve(mfs.readFileSync('/test.build.js').toString());
		});
	});
}

function run(src) {
	const {default: Component} = eval(src);
	const vm = new Vue(Component);
	vm.$mount();
	return vm._vnode;
}

test('Build markdown', async () => {
	const built = await build(outdent`
		# Hello
		Hello world
	`);
	const vnode = run(built);

	expect(vnode.tag).toBe('div');
	expect(vnode.children[0].tag).toBe('h1');
	expect(vnode.children[0].children[0].text).toBe('Hello');
});

test('Markdown-it no HTML', async () => {
	const built = await build(outdent`
		# Hello
		<div></div>
	`);
	const vnode = run(built);
	expect(vnode.tag).toBe('div');
	expect(vnode.children[2].tag).toBe('p');
	expect(vnode.children[2].children[0].text).toBe('<div></div>');
});

test('Markdown-it config HTML', async () => {
	const built = await build(outdent`
		# Hello
		<div>DIV Content</div>
	`, {
		markdownItOpts: {
			html: true,
		},
	});
	const vnode = run(built);
	expect(vnode.tag).toBe('div');
	expect(vnode.children[2].tag).toBe('div');
	expect(vnode.children[2].children[0].text).toBe('DIV Content');
});

test('Markdown-it plugins', async () => {
	const built = await build(outdent`
		# Hello
	`, {
		markdownItPlugins: [
			[require('markdown-it-anchor'), {permalink: true}],
		],
	});
	const vnode = run(built);
	expect(vnode.tag).toBe('div');
	expect(vnode.children[0].tag).toBe('h1');
	expect(vnode.children[0].data.attrs.id).toBe('hello');
	expect(vnode.children[0].children[1].tag).toBe('a');
	expect(vnode.children[0].children[1].data.attrs.href).toBe('#hello');
});

test('Build markdown with codeblock', async () => {
	const built = await build(outdent`
		# Hello
		Hello world

		\`\`\`vue
		<template>
			<div>Hello</div>
		</template>
		\`\`\`

		\`\`\`vue
		<template>
			<div>Good bye</div>
		</template>
		\`\`\`
	`);
	const vnode = run(built);

	expect(vnode.tag).toBe('div');
	expect(vnode.children[0].tag).toBe('h1');
	expect(vnode.children[0].children[0].text).toBe('Hello');

	const codeBocks = vnode.children.filter(v => v.tag === 'pre');
	expect(codeBocks.length).toBe(2);
});

test('Build markdown with demo', async () => {
	const built = await build(outdent`
		# Hello
		Hello world

		\`\`\`vue
		<template>
			<div>Hello</div>
		</template>
		\`\`\`

		\`\`\`vue
		<template>
			<div>Good bye</div>
		</template>
		\`\`\`
	`, {
		buildDemos: true,
	});
	const vnode = run(built);

	expect(vnode.tag).toBe('div');
	expect(vnode.children[0].tag).toBe('h1');
	expect(vnode.children[0].children[0].text).toBe('Hello');
});

test('Build markdown with doc file imports', async () => {
	const built = await build(outdent`
		# Hello
		Hello world

		\`\`\`vue
		<template>
			<div>Hello</div>
		</template>
		<script>
		import Goodbye from 'doc/Goodbye.vue';

		export default {};
		</script>
		\`\`\`

		_Goodbye.vue_
		\`\`\`vue
		<template>
			<div>Good bye</div>
		</template>
		\`\`\`

		\`\`\`vue
		<template>
			<div>Hello</div>
		</template>
		<script>
		import Goodbye from 'doc/Goodbye.vue';

		export default {};
		</script>
		\`\`\`
	`, {
		buildDemos: true,
	});
	const vnode = run(built);

	expect(vnode.tag).toBe('div');
	expect(vnode.children[0].tag).toBe('h1');
	expect(vnode.children[0].children[0].text).toBe('Hello');

	const demos = vnode.children.filter(v => v.componentInstance);
	expect(demos.length).toBe(2);
	expect(demos[0].tag.endsWith('Demo0')).toBe(true);
	expect(demos[1].tag.endsWith('Demo1')).toBe(true);
});

test('Build markdown with buildDemos function', async () => {
	const built = await build(outdent`
		# Hello
		Hello world

		\`\`\`vue
		<template>
			<div>Hello</div>
		</template>
		\`\`\`
	`, {
		buildDemos(demoTag) {
			return demoTag;
		},
	});
	const vnode = run(built);

	expect(vnode.tag).toBe('div');
	expect(vnode.children[0].tag).toBe('h1');
	expect(vnode.children[0].children[0].text).toBe('Hello');

	const demos = vnode.children.filter(v => v.componentInstance);
	expect(demos.length).toBe(1);
});
