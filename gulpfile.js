var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    sass = require('gulp-ruby-sass'),
    sourcemaps = require('gulp-sourcemaps'),
    imagemin = require('gulp-imagemin'),
    autoprefixer = require('autoprefixer'),
    postcss = require('gulp-postcss');

// Scripts Tasks
// 1.uglify
gulp.task('scripts', function(){
    gulp.src('js/*.js')
    .pipe(uglify())
    .pipe(gulp.dest('build/js'));
});

// Styles Tasks
// 1.compile scss
// 2.compress css
// 3.add prefix
// 4.add sourcemaps
gulp.task('styles', function(){
    sass('scss/**/*.scss', {
        style: 'compressed',
        sourcemap: true
    })
    .on('error', sass.logError)
    .pipe(postcss([autoprefixer()]))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('build/css'));
});

// Images Tasks
// 1.compress images
gulp.task('images', function(){
    gulp.src('img/*')
    .pipe(imagemin())
    .pipe(gulp.dest('build/img'))
});

// Watch Tasks
// 1.watch javascript
// 2.watch scss
gulp.task('watch', function(){
    gulp.watch('js/*.js', ['scripts']);
    gulp.watch('scss/**/*.scss', ['styles']);
})

gulp.task('default', ['scripts', 'styles', 'watch']);

gulp.task('build', ['scripts', 'styles', 'images'])