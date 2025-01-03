const gulp = require('gulp');
const terser = require('gulp-terser');
const rename = require('gulp-rename');
const sourcemaps = require('gulp-sourcemaps');
const header = require('gulp-header');
const pkg = require('./package.json');
const del = require('gulp-clean');

// Banner for the minified file
const banner = [
    '/*! <%= pkg.name %> v<%= pkg.version %>',
    ' * <%= pkg.description %>',
    ' * (c) ' + new Date().getFullYear() + ' <%= pkg.author %>',
    ' * Released under the <%= pkg.license %> License',
    ' */',
    ''
].join('\n');

// Add clean task
gulp.task('clean', () => {
    return gulp.src('dist/*', { read: false })
        .pipe(del());
});

// Main build task
gulp.task('build', gulp.series('clean', () => {
    return gulp.src('src/**/*.js')
        .pipe(sourcemaps.init())
        .pipe(terser({
            compress: {
                drop_console: false,
                drop_debugger: true
            },
            mangle: true,
            output: {
                comments: /^!/
            }
        }))
        .pipe(header(banner, { pkg }))
        .pipe(rename(path => {
            if (!path.basename.endsWith('.min')) {
                path.basename += '.min';
            }
        }))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('dist'));
}));

// Watch task
gulp.task('watch', () => {
    gulp.watch('src/**/*.js', gulp.series('build'));
});

// Default task
gulp.task('default', gulp.series('build')); 