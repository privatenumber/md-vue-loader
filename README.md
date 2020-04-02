# md-vue-loader
Webpack loader to import markdown files as Vue components. Compatible with vue-loader v15.

```bash
npm install --save-dev md-vue-loader
```

**webpack.config.js**
```js
module.exports = {
  module: {
    rules: [
      {
        test: /\.md.vue$/,
        use: [
          'vue-loader',
          'md-vue-loader'
        ]
      }
    ]
  }
}
```


### Inline demos
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
