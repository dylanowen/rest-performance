'use strict'

var gulp = require('gulp');
var ts = require('gulp-typescript');
var watch = require('gulp-watch');
var runSequence = require('run-sequence');
var del = require('del');

var config = {
    staticTargets : ['src/*.*', 'src/css/**/*.*', 'src/ace/**/*.*'],
    tsSrc: 'src/ts/',
    buildDest: 'build/',
    ts: {
        noImplicitAny: true,
        target: 'es6'
    }
};

gulp.task('clean', function(cb) {
    return del([config.buildDest + "*"]);
})

gulp.task('build:static', function() {
    return gulp.src(config.staticTargets, {base: 'src'})
        .pipe(gulp.dest(config.buildDest));
});

function typescript(outputName) {
    var tsConfig = config.ts;
    tsConfig.out = 'js/' + outputName + '.js';

    return gulp.src(config.tsSrc + outputName + '/**/*.ts')
        .pipe(ts(tsConfig))
        .pipe(gulp.dest(config.buildDest));
}

gulp.task('build:ts:background', typescript.bind(null, 'background'));
gulp.task('build:ts:sandbox', typescript.bind(null, 'sandbox'));
gulp.task('build:ts:main', typescript.bind(null, 'main'));
gulp.task('build:ts:worker', typescript.bind(null, 'worker'));
gulp.task('build:ts', function(cb) {
    runSequence(['build:ts:background', 'build:ts:sandbox', 'build:ts:main', 'build:ts:worker'], cb);
});
gulp.task('build', function(cb) {
    runSequence('clean', ['build:static', 'build:ts'], cb);
});

gulp.task('default', ['build']);