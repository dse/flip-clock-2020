var gulp          = require('gulp');
var browserSync   = require('browser-sync').create();
var $             = require('gulp-load-plugins')();
var autoprefixer  = require('autoprefixer');
var cleanCSS      = require('gulp-clean-css');

var sassPaths = [
    'node_modules/foundation-sites/scss',
    'node_modules/motion-ui/src'
];

var autoprefixerOptions = {
    overrideBrowserslist: ['last 2 versions', 'ie >= 9', 'safari >= 6']
};

function sass() {
    return gulp.src('scss/*.scss', { sourcemaps: true })
        .pipe($.sass({
            includePaths: sassPaths,
            outputStyle: 'expanded'
        }).on('error', $.sass.logError))
        .pipe($.postcss([
            autoprefixer(autoprefixerOptions)
        ]))
        .pipe(gulp.dest('css'))
        .pipe(cleanCSS())
        .pipe($.rename({ extname: '.min.css' }))
        .pipe(gulp.dest('css', { sourcemaps: '.' }))
        .pipe(browserSync.stream());
}

function serve() {
    browserSync.init({
        server: "./"
    });
    gulp.watch("scss/*.scss", gulp.series(sass));
    gulp.watch("*.html").on('change', browserSync.reload);
}

function watch() {
    gulp.watch("scss/*.scss", gulp.series(sass));
}

gulp.task('sass', gulp.series(sass));
gulp.task('serve', gulp.series('sass', serve));
gulp.task('default', gulp.series('sass', serve));
gulp.task('watch', gulp.series('sass', watch));
