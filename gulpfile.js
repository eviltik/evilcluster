const gulp = require('gulp');
const exec = require('child_process').exec;

PKG_EXEC = 'pkg . --options expose-gc -t node8-win-x64';

gulp.task(
    'make-pkg',
    function(cb) {
        let p = exec(PKG_EXEC, cb);
        p.stdout.pipe(process.stdout);
        p.stderr.pipe(process.stderr);
    }
);
