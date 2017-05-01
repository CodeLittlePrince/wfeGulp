var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    sass = require('gulp-ruby-sass'),
    sourcemaps = require('gulp-sourcemaps'),
    imagemin = require('gulp-imagemin'),
    autoPrefixer = require('autoprefixer'),
    postCss = require('gulp-postcss'),
    del = require('del'),
    rev = require('gulp-rev'),
    revCollector = require('gulp-rev-collector'),
    spriteSmith = require('gulp.spritesmith'),
    buffer = require('vinyl-buffer'),
    csso = require('gulp-csso'),
    merge = require('merge-stream');

var paths = {
    scripts: {
        rev: 'src/rev/js/',
        dest: 'dest/js/'
    },
    styles: {
        rev: 'src/rev/css/',
        dest: 'dest/css/',
        spriteDest: 'src/css/sprite/'
    },
    images: {
        rev: 'src/rev/img/',
        dest: 'dest/img/',
        spriteDest: 'src/img/sprite/'
    },
    tpl: {
        dest: 'dest/'
    }
};

var resources = {
    scripts: {
        src: 'src/js/**/*.js'
    },
    styles: {
        src: 'src/scss/**/*.scss'
    },
    images: {
        src: 'src/img/**',
        spriteSrc: 'src/img/**/*.png'
    },
    tpl: {
        src: 'src/*.html'
    }
}
// Scripts process
// 1.uglify
// 2.generate mainfest and hash files
function scripts(){
    return gulp.src(resources.scripts.src)
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
    return sass(resources.styles.src, {
            style: 'compressed',
            sourcemap: true
        })
        .on('error', sass.logError)
        .pipe(postCss([autoPrefixer()]))
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
    return gulp.src(resources.images.src)
        .pipe(imagemin())
        .pipe(rev())
        .pipe(gulp.dest(paths.images.dest))
        .pipe(rev.manifest())
        .pipe(gulp.dest(paths.images.rev));
}

// Generate Sprite
function sprite() {
    var spriteData = gulp.src(resources.images.spriteSrc).pipe(spriteSmith({
        imgName: 'sprite.png',
        cssName: 'sprite.css'
    }));
    // Pipe image stream through image optimizer and onto disk 
    var imgStream = spriteData.img
    // DEV: We must buffer our stream into a Buffer for `imagemin` 
    .pipe(buffer())
    // .pipe(imagemin())
    .pipe(gulp.dest(paths.images.spriteDest));

    // Pipe CSS stream through CSS optimizer and onto disk 
    var cssStream = spriteData.css
    // .pipe(csso())
    .pipe(gulp.dest(paths.styles.spriteDest));

    // Return a merged stream to handle both `end` events 
    return merge(imgStream, cssStream);
}

// Clean
function clean(){
    return del(['dest/**', 'src/rev/**']);
}

// Replace (JS CSS Img)'s links in HTML
// e.g.: css/index.css => dest/css/index.css
function replace() {
    return gulp.src(['src/rev/**/*.json', resources.tpl.src])
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
    gulp.watch(resources.scripts.src, scripts);
    gulp.watch(resources.styles.src, styles);
}

exports.clean = clean;
exports.scripts = scripts;
exports.styles = styles;
exports.images = images;
exports.watch = watch;

gulp.task('default',  gulp.parallel(scripts, styles, watch));

gulp.task('build', gulp.series(
    clean,
    sprite,
    gulp.parallel(scripts, styles, images),
    replace,
    replaceCssUrl
));