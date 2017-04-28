# [gulp](https://github.com/wearefractal/gulp)-clean-old

> Removes files and folders.

## Information

<table>
<tr> 
<td>Package</td><td>gulp-clean-old</td>
</tr>
<tr>
<td>Description</td>
<td>This is a fork of the original <a href="https://github.com/peter-vilja/gulp-clean">gulp-clean</a>, compatible with older versions of node</td>
</tr>
<tr>
<td>Node Version</td>
<td>>= 0.8</td>
</tr>
</table>

## Install

Install with [npm](https://npmjs.org/package/gulp-clean-old).

```
npm install --save-dev gulp-clean-old
```

## Example

```js
var gulp = require('gulp');
var clean = require('gulp-clean-old');

gulp.task('default', function() {
	gulp.src('app/tmp', {read: false})
		.pipe(clean());
});
```
Option read false prevents gulp to read the contents of the file and makes this task a lot faster.

After using gulp-clean-old the stream still contains the app/tmp and it can be used i.e. for moving the content to different location.

```js
var gulp = require('gulp');
var clean = require('gulp-clean-old');

gulp.task('default', function() {
	gulp.src('app/tmp/index.js', {read: false})
		.pipe(clean({force: true}));
		.pipe(gulp.dest('dist'));
});
```

#### For safety files and folders outside the current working directory can be removed only with option force set to true.

## License

[MIT](http://en.wikipedia.org/wiki/MIT_License) @ Peter Vilja
