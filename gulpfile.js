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

// Scripts Tasks
// 1.uglify
// 2.generate mainfest
function scripts(){
    return gulp.src('js/*.js')
        .pipe(uglify())
        .pipe(rev())
        .pipe(gulp.dest('build/js'))
        .pipe(rev.manifest())
        .pipe(gulp.dest('rev/js'));
}

// Styles Tasks
// 1.compile scss
// 2.compress css
// 3.add prefix
// 4.add sourcemaps
// 5.generate mainfest
function styles(){
    return sass('scss/**/*.scss', {
        style: 'compressed',
        sourcemap: true
    })
    .on('error', sass.logError)
    .pipe(postcss([autoprefixer()]))
    .pipe(sourcemaps.write())
    .pipe(rev())
    .pipe(gulp.dest('build/css'))
    .pipe(rev.manifest())
    .pipe(gulp.dest('rev/css'));
}

// Images Tasks
// 1.compress images
// 2.generate mainfest
function images(){
    return gulp.src('img/*')
        .pipe(imagemin())
        .pipe(rev())
        .pipe(gulp.dest('build/img'))
        .pipe(rev.manifest())
        .pipe(gulp.dest('rev/img'));
}

// Clean Resource For "add resource hash version"
function clean(){
    return del(['build/**/*', 'rev/**/*']);
}

// Genetate Files With Hash Suffix & Replace Link In HTML
function replace() {
    return gulp.src(['rev/**/*.json','index.html'])
        .pipe(revCollector({
            replaceReved: true,  //模板中已经被替换的文件是否还能再被替换,默认是false
            dirReplacements: {   //标识目录替换的集合, 因为gulp-rev创建的manifest文件不包含任何目录信息,
                'css/': 'css/',
                'js/': 'js/'
            }
        }))
        .pipe(gulp.dest('build'));
}

// Watch Tasks
// 1.watch javascript
// 2.watch scss
function watch(){
    gulp.watch('js/*.js', scripts);
    gulp.watch('scss/**/*.scss', styles);
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