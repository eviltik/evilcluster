const spawn = require('child_process').spawn;
const async = require('async');
const fs = require('fs');
const tap = require('tap');
const common = require('./common')(__filename);
const readline = require('readline');

let testPath = 'test/';
let tests = fs.readdirSync(testPath);
let i = 0;
function testsStart() {
    async.mapSeries(tests,function(test,next) {
        if (!test.match(/^[0-9]/)) return next();
        i++;
        //if (i>7) return;

        tap.test(test, {bail:true}, (t) => {

            let expected = require('./' + test).expected;
            if (!expected.exitCode) expected.exitCode = 0;
            if (!expected.stderr) expected.stderr = [];

            test = testPath + test;

            let sub = spawn('node', [test]);
            let stdout = [];
            let stderr = [];

            let rlStdout = readline.createInterface({
                input     : sub.stdout,
            }).on('line', (line) => {
                console.log(line);
                stdout.push(line);
            });

            let rlStderr = readline.createInterface({
                input     : sub.stderr,
            }).on('line', (line) => {
                console.log(line);
                stderr.push(line);
            });

            sub.on('exit', function (code) {
                t.same(code, expected.exitCode, 'exit code should be '+expected.exitCode);
                t.same(stderr.length, expected.stderr.length, 'stderr line count should match '+expected.stderr.length);
                t.same(stdout.length, expected.stdout.length, 'stdout line count should match '+expected.stdout.length);

                expected.stderr.forEach((line, idx) => {
                    t.same(stderr[idx], line, 'stderr line '+(idx+1)+' should be "'+line+'"');
                });

                expected.stdout.forEach((line, idx) => {
                    t.same(stdout[idx], line, 'stdout line '+(idx+1)+' should be "'+line+'"');
                });

                t.end();
                rlStdout.close();
                rlStderr.close();
                next();
            });
        });
    });
}

testsStart();