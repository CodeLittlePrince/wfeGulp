var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    sass = require('gulp-ruby-sass'),
    sourcemaps = require('gulp-sourcemaps'),
    imagemin = require('gulp-imagemin'),
    autoprefixer = require('autoprefixer'),
    postcss = require('gulp-postcss'),
    del = require('del'),
    rev = require('gulp-rev'),
    revCollector = require('gulp-rev-collector');

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
    src: 'src/img/**',
    rev: 'src/rev/img/',
    dest: 'dest/img/'
  },
  tpl: {
    src: 'src/*.html',
    dest: 'dest/'
  }
};
// Scripts process
// 1.uglify
// 2.generate mainfest and hash files
function scripts(){
    return gulp.src(paths.scripts.src)
        .pipe(uglify())
        .pipe(rev())
        .pipe(gulp.dest(paths.scripts.dest))
        .pipe(rev.manifest())
        .pipe(gulp.dest(paths.scripts.rev));
}

// Styles process
// 1.compile scss
// 2.compress css
// 3.add prefix
// 4.add sourcemaps
// 5.generate mainfest and hash files
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

// Images process
// 1.compress images
// 2.generate mainfest and hash files
function images(){
    return gulp.src(paths.images.src)
        .pipe(imagemin())
        .pipe(rev())
        .pipe(gulp.dest(paths.images.dest))
        .pipe(rev.manifest())
        .pipe(gulp.dest(paths.images.rev));
}

// Clean
function clean(){
    return del(['dest/**', 'src/rev/**']);
}

// Replace (JS CSS Img)'s links in HTML
// e.g.: css/index.css => dest/css/index.css
function replace() {
    return gulp.src(['src/rev/**/*.json', paths.tpl.src])
        .pipe(revCollector({
            replaceReved: true,  //模板中已经被替换的文件是否还能再被替换,默认是false
            dirReplacements: {   //标识目录替换的集合, 因为gulp-rev创建的manifest文件不包含任何目录信息,
                'css/': 'css/',
                'js/': 'js/',
                'img/': 'img/'
            }
        }))
        .pipe(gulp.dest('dest'));
}
// Replace Image Url in CSS
function replaceCssUrl() {
    return gulp.src(['src/rev/img/*.json', 'dest/css/**/*.css'])
        .pipe(revCollector())
        .pipe(gulp.dest('dest/css'));
}
// Watch
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
    replace,
    replaceCssUrl
));