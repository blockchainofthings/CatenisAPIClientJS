var gulp = require('gulp');
var jasmineBrowser = require('gulp-jasmine-browser');

gulp.task('jasmine-chrome', function() {
    return gulp.src(['test/helpers/*.js', 'build/CatenisAPIClientJS.min.js', 'test/**/*Spec.js'])
    .pipe(jasmineBrowser.specRunner({
        console: true
    }))
    .pipe(jasmineBrowser.headless({
        catch: true,
        driver: 'chrome',
        throwFailures: false
    }));
});

gulp.task('jasmine-chrome-compress', function() {
    return gulp.src(['test/helpers/*.js', 'build/CatenisAPIClientJS.min.js', 'test/TestDataCompressionSpec.js'])
    .pipe(jasmineBrowser.specRunner({
        console: true
    }))
    .pipe(jasmineBrowser.headless({
        catch: true,
        driver: 'chrome',
        throwFailures: false,
        random: false
    }));
});
