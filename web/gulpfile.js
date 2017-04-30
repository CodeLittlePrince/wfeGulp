var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    sass = require('gulp-ruby-sass'),
    sourcemaps = require('gulp-sourcemaps'),
    imagemin = require('gulp-imagemin'),
    autoprefixer = require('autoprefixer'),
    postcss = require('gulp-postcss'),
    del = require('del'),
    rev = require('gulp-rev'),
    revCollector = require('gulp-rev-collector'),
    srcReplace = require('gulp-replace-src');

var paths = {
  scripts: {
    src: 'src/js/**/*.js',
    rev: 'src/rev/js/',
    dest: 'dest/js/'
  },
  styles: {
    src: 'src/scss/**/*.scss',
    rev: 'src/rev/css/',
    dest: 'dest/css/'
  },
  images: {
    src: 'src/img/**/*',
    rev: 'src/rev/img/',
    dest: 'dest/img/'
  },
  tpl: {
    src: 'src/*.html',
    dest: 'dest/'
  }
};
// Scripts Tasks
// 1.uglify
// 2.generate mainfest
function scripts(){
    return gulp.src(paths.scripts.src)
        .pipe(uglify())
        .pipe(rev())
        .pipe(gulp.dest(paths.scripts.dest))
        .pipe(rev.manifest())
        .pipe(gulp.dest(paths.scripts.rev));
}

// Styles Tasks
// 1.compile scss
// 2.compress css
// 3.add prefix
// 4.add sourcemaps
// 5.generate mainfest
function styles(){
    return sass(paths.styles.src, {
            style: 'compressed',
            sourcemap: true
        })
        .on('error', sass.logError)
        .pipe(postcss([autoprefixer()]))
        .pipe(sourcemaps.write())
        .pipe(rev())
        .pipe(gulp.dest(paths.styles.dest))
        .pipe(rev.manifest())
        .pipe(gulp.dest(paths.styles.rev));
}

// Images Tasks
// 1.compress images
// 2.generate mainfest
function images(){
    return gulp.src(paths.images.src)
        .pipe(imagemin())
        .pipe(rev())
        .pipe(gulp.dest(paths.images.dest))
        .pipe(rev.manifest())
        .pipe(gulp.dest(paths.images.rev));
}

// Clean Resource For "add resource hash version"
function clean(){
    return del(['dest/**/*']);
}

// Genetate Files With Hash Suffix & Replace Link In HTML
function replace() {
    return gulp.src(['src/rev/**/*.json', paths.tpl.src])
        .pipe(revCollector({
            replaceReved: true,  //模板中已经被替换的文件是否还能再被替换,默认是false
            dirReplacements: {   //标识目录替换的集合, 因为gulp-rev创建的manifest文件不包含任何目录信息,
                'css/': 'css/',
                'js/': 'js/'
            }
        }))
        .pipe(gulp.dest('dest'));
}

// Watch Tasks
// 1.watch javascript
// 2.watch scss
function watch(){
    gulp.watch(paths.scripts.src, scripts);
    gulp.watch(paths.styles.src, styles);
}

exports.clean = clean;
exports.scripts = scripts;
exports.styles = styles;
exports.images = images;
exports.watch = watch;

gulp.task('default',  gulp.parallel(scripts, styles, watch));

gulp.task('build', gulp.series(
    clean,
    gulp.parallel(scripts, styles, images),
    replace
));