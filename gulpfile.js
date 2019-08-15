var gulp = require('gulp');
var jasmineBrowser = require('gulp-jasmine-browser');

gulp.task('jasmine-chrome', function() {
    var testSpecs = '**/*Spec.js';

    if (process.env.TEST_SPECS) {
        testSpecs = process.env.TEST_SPECS;

        if (process.env.npm_package_version) {
            testSpecs = testSpecs.replace('{!npm_package_version}', process.env.npm_package_version);
        }
    }

    return gulp.src(['test/helpers/*.js', 'build/CatenisAPIClientJS.min.js', 'test/' + testSpecs])
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
