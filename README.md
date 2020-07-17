# md-vue-loader <a href="https://npm.im/md-vue-loader"><img src="https://badgen.net/npm/v/md-vue-loader"></a> <a href="https://npm.im/md-vue-loader"><img src="https://badgen.net/npm/dm/md-vue-loader"></a> <a href="https://packagephobia.now.sh/result?p=md-vue-loader"><img src="https://packagephobia.now.sh/badge?p=md-vue-loader"></a>

`md-vue-loader` is a Webpack loader to import Markdown files as Vue components.

## :raising_hand: Why?
- **🙌 Decoupled from Vue** Compatible with any version of [Vue](https://github.com/vuejs/vue) (or [`vue-loader`](https://vue-loader.vuejs.org)/`vue-template-compiler`)!
- **👩‍🎨 Vue code rendering** Opt intto rendering Vue code-ferences to inline Demos!
- **⚙️ Customizable** Configure your demo to be syntax-highlighted, or wrapped in any component!

## :rocket: Install
```bash
npm i -D md-vue-loader
```

## 🚦 Quick Setup
Add to your Webpack config:

```diff
module.exports = {
    module: {
        rules: [
+            {
+                test: /\.md.vue$/,
+                use: [
+                    'vue-loader',
+                    'md-vue-loader'
+                ]
+            }
        ]
    },

    /// ...
}
```

## Examples

### Inlining Vue demos
You can inline `vue` codeblocks like the following as inline-demos by enabling the `buildDemos` option.

````
```vue
<template>
    <div>Hello world!</div>
</template>
```
````

To enable `buildDemos`, pass in options in your Webpack config:

```diff
module.exports = {
    module: {
        rules: [
            {
                test: /\.md$/,
                use: [
                    'vue-loader',
+                    {
+                        loader: 'md-vue-loader',
+                        options: {
+                            buildDemos: true
+                        }
+                    }
                ]
            }
        ]
    },

    /// ...
}
```

### Multi-file demos
Demos can be multi-file by naming code-blocks by prepending it with the filename in wrapped in underscores. You can import these code-blocks within the `doc` alias.

Name a code-block:
````
_HelloWorld.vue_
```vue
<template>
    <div>
        Hello World
    </div>
</template>
```
````

Import the code-block from `doc/HelloWorld.vue`:
````
```vue
<template>
    <hello-world />
</template>

<script>
import HelloWorld from 'doc/HelloWorld.vue';

export default {
    components: {
        HelloWorld
    }
}
</script>
```
````

### Wrapping demos in custom markup
You might want more control over how your demo is inlined to have it wrapped for styling, or to have the source-code next to it.

To configure the demo markup, you can pass in a function to control how the component is inlined: `function (demoTag, files)`. In the function context, you have access to `this.addComponent([...named imports], 'module-name')` to register external components.

In this example, I use [`vue-demo-collapse`](https://www.npmjs.com/package/vue-demo-collapse) to wrap my demo with the expandable container with the source-code:

```diff
module.exports = {
    module: {
        rules: [
            {
                test: /\.md$/,
                use: [
                    'vue-loader',
+                    {
+                        loader: 'md-vue-loader',
+                        options: {
+                            buildDemos(Tag, demoFiles) {
+                                this.addComponent(['DemoCollapse', 'SrcFile'], 'vue-demo-collapse');
+
+                                const listFiles = demoFiles
+                                    .map((file) => `<src-file name="${file.name || ''}" language="html"><template v-pre>${ent.encode(file.content)}</template></src-file>`)
+                                    .join('');
+
+                                return `
+                                <demo-collapse>
+                                    ${Tag}
+                                    ${listFiles}
+                                </demo-collapse>
+                                `;
+                            }
+                        }
+                    }
                ]
            }
        ]
    },

    /// ...
}
```
