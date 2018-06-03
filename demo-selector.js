module.exports = function(src) {
	console.log('demo-selector-loader from', this.resourcePath, this.resourceQuery);

	return `
	<template>
		<div>TEST</div>
	</template>
	`;
	return src;
};
