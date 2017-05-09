// 同时安装-g 的gulp4.0
var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    sass = require('gulp-sass'),
    sourcemaps = require('gulp-sourcemaps'),
    imagemin = require('gulp-imagemin'),
    autoPrefixer = require('autoprefixer'),
    postCss = require('gulp-postcss'),
    del = require('del'),
    mkdirp = require('mkdirp'),
    rev = require('gulp-rev'),
    revCollector = require('gulp-rev-collector'),
    spriteSmith = require('gulp.spritesmith'),
    buffer = require('vinyl-buffer'),
    csso = require('gulp-csso'),
    merge = require('merge-stream'),
    // gulpWatch = require('gulp-watch'),
    path = require('path');
    // cache = require('gulp-cached'),
    // changed = require('gulp-changed');

var paths = {
    scripts: {
        rev: 'src/rev/js/',
        dest: 'dest/js/'
    },
    styles: {
        rev: 'src/rev/css/',
        cssSrc: 'src/css/',
        scssSrc: 'src/scss/',
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
        scssSrc: 'src/scss/**/*.scss',
        cssSrc: 'src/css/**/*.css'
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
gulp.task('scripts', function(){
    return gulp.src(resources.scripts.src)
        .pipe(uglify())
        .pipe(rev())
        .pipe(gulp.dest(paths.scripts.dest))
        .pipe(rev.manifest())
        .pipe(gulp.dest(paths.scripts.rev));
});

// Styles process
// 1.compile scss
// 2.compress css
// 3.add prefix
// 4.add sourcemaps
gulp.task('parseSass', function(){
    return gulp.src(resources.styles.scssSrc, {since: gulp.lastRun('parseSass')}) // since 设置后，只会parseSass修改过的文件
        .pipe(sourcemaps.init())
        .pipe(
            sass({
                outputStyle: 'compressed'
            })
            .on('error', sass.logError)
        )
        .pipe(postCss([autoPrefixer()]))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(paths.styles.cssSrc))
});
// Generate CSS mainfest and hash files
gulp.task('stylesHash', function(){
    return gulp.src(resources.styles.cssSrc)
        .pipe(rev())
        .pipe(gulp.dest(paths.styles.dest))
        .pipe(rev.manifest())
        .pipe(gulp.dest(paths.styles.rev));
});

// Images process
// 1.compress images
// 2.generate mainfest and hash files
gulp.task('images', function(){
    return gulp.src(resources.images.src)
        .pipe(imagemin())
        .pipe(rev())
        .pipe(gulp.dest(paths.images.dest))
        .pipe(rev.manifest())
        .pipe(gulp.dest(paths.images.rev));
});

// Generate Sprite
gulp.task('sprite', function(){
    var spriteData = gulp.src(resources.images.spriteSrc).pipe(spriteSmith({
        imgName: 'sprite.png',
        cssName: 'sprite.css',
        padding: 10,
        cssVarMap: function(sprite) {
            // sprite.name = 'icon-' + sprite.name;
            sprite.name = sprite.name;
        }
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
});

// Clean
gulp.task('clean', function(){
    return del(['dest/**', 'src/rev/**', paths.images.spriteDest, paths.styles.cssSrc]);
});

// Replace (JS CSS Img)'s links in HTML
// e.g.: css/index.css => dest/css/index.css
gulp.task('replace', function(){
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
});
// Replace Image Url in CSS
gulp.task('replaceCssUrl',function(){
    return gulp.src(['src/rev/img/*.json', 'dest/css/**/*.css'])
        .pipe(revCollector())
        .pipe(gulp.dest('dest/css'));
});
// Watch
// 1.watch javascript
// 2.watch scss
gulp.task('watch',function(){
    // gulp.watch(resources.scripts.src, scripts);
    var watcher = gulp.watch(paths.styles.scssSrc); // 这里注意要是添监控文件的话就触发不了unlinkDir这样的事件了 
    watcher
        .on('add', gulp.parallel('parseSass')) // 文件增加的时候事件处理
        .on('change', gulp.parallel('parseSass')) // 文件改变的时候事件处理
        .on('unlink', file => { // 文件删除的时候事件处理
            var filePathFromSrc = path.relative(path.resolve(paths.styles.scssSrc), file);
            var destFilePath = path.resolve(paths.styles.cssSrc, filePathFromSrc).slice(0, -4);
            destFilePath += 'css';
            del.sync(destFilePath);
        })
        .on('unlinkDir', dirPath => { // 文件夹删除的时候事件处理
            var dirPathFromSrc = path.relative(path.resolve(paths.styles.scssSrc), dirPath);
            var destDirPath = path.resolve(paths.styles.cssSrc, dirPathFromSrc);
            del.sync(destDirPath);
        })
        .on('addDir', dirPath => { // 文件夹增加的时候事件处理
            var dirPathFromSrc = path.relative(path.resolve(paths.styles.scssSrc), dirPath);
            var destDirPath = path.resolve(paths.styles.cssSrc, dirPathFromSrc);
            mkdirp(destDirPath, function(err){
                if (err) {
                    console.log(err);
                }
            })
        });
});

// exports.clean = clean;
// exports.scripts = scripts;
// exports.'parseSass' = 'parseSass';
// exports.stylesHash = stylesHash;
// exports.sprite = sprite;
// exports.images = images;
// exports.watch = watch;
// exports.replace = replace;
// exports.replaceCssUrl = replaceCssUrl;

// gulp.task('default',  gulp.parallel(scripts, styles, watch));
gulp.task('default', gulp.series(
    'clean',
    gulp.parallel('parseSass', 'watch')
    )
);

gulp.task('build', gulp.series(
    'clean',
    gulp.parallel(
        'scripts',
        gulp.series('parseSass', 'sprite', 'stylesHash', 'images')
    ),
    'replace',
    'replaceCssUrl'
));