const mdvueLoaderPath = require.resolve('.');

const outdent = require('outdent');
const webpack = require('webpack');
const MemoryFS = require('memory-fs');
const fs = require('fs');
const { ufs } = require('unionfs');
const VueLoaderPlugin = require('vue-loader/lib/plugin')


const Vue = require('vue');


function build(input, loaderConfig = {}) {
	return new Promise((resolve, reject) => {
		const mfs = new MemoryFS();

		mfs.writeFileSync('/entry.md', input);

		const compiler = webpack({
			mode: 'development',
			resolveLoader: {
				alias: {
					'mdvue-loader': mdvueLoaderPath,
				},
			},
			module: {
				rules: [
					{
						test: /\.vue$/,
						loader: 'vue-loader'
					},
					{
						test: /\.md$/,
						use: [
							'vue-loader',
							{
								loader: 'mdvue-loader',
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
						// 				loader: 'mdvue-loader',
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

		compiler.run(function (err, stats) {
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
	const { default: Component } = eval(src);
	const vm = new Vue(Component);
	vm.$mount();
	return vm._vnode;
}

	// build(`# helloworld`)
	// build(outdent`
	// 	# helloworld

	// 	\`\`\`vue
	// 	helloworld
	// 	\`\`\`
	// 	\`\`\`vue
	// 	helloworld
	// 	\`\`\`
	// `)



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
		buildDemos: true
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
		buildDemos: true
	});
	const vnode = run(built);

	expect(vnode.tag).toBe('div');
	expect(vnode.children[0].tag).toBe('h1');
	expect(vnode.children[0].children[0].text).toBe('Hello');
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
		buildDemos(demoTag, files) {
			console.log('buildDemos');

			return demoTag;
		},
	});
	const vnode = run(built);

	expect(vnode.tag).toBe('div');
	expect(vnode.children[0].tag).toBe('h1');
	expect(vnode.children[0].children[0].text).toBe('Hello');
});

