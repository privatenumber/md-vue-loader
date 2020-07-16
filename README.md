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
You can inline `vue` codeblocks as inline demos by enabling the `buildDemos` option.

```js
{
  loader: 'md-vue-loader',
  options: {
    buildDemos: true
  }
}
```

Pass in a function with the following signature to control how the component is inlined: `function (demoTag, files)`


### Multi-file demos
Demos can be multi-file by:
1. Naming a codeblock by prepending it with the filename in underscores
2. Importing that file via the `doc` alias

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

_HelloWorld.vue_
```vue
<template>
  <div>
    Hello World
  </div>
</template>
```
