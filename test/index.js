const spawn = require('child_process').spawn;
const async = require('async');
const fs = require('fs');
const tap = require('tap');
const readline = require('readline');

process.setMaxListeners(0);

let testPath = 'test/';
let tests = fs.readdirSync(testPath);
let i = 0;
function testsStart() {
    async.mapSeries(tests,function(test,next) {
        if (!test.match(/^[0-9]/)) return next();
        i++;

        //if (i!=11) return next();

        tap.test(test, {bail:true}, (t) => {

            t.pass('requiring ./' + test);

            let expected = require('./' + test).expected;

            t.equal(typeof expected, 'object', 'expected should be an object');

            if (!expected.exitCode) expected.exitCode = 0;
            if (!expected.stderr) expected.stderr = [];

            test = testPath + test;

            let sub = spawn('node', [test]);
            let stdout = [];
            let stderr = [];

            let rlStdout = readline.createInterface({
                input     : sub.stdout,
            }).on('line', (line) => {
                //console.log(line);
                // ignore line when debug log
                // when env var DEBUG is set
                if (!line.match(/^[0-9]{4}\-/)) {
                    let expectedLine = expected.stdout[stdout.length];
                    stdout.push(line);
                    t.same(line, expectedLine, 'stdout line '+(stdout.length)+' should be "'+expectedLine+'"');
                }
            });

            let rlStderr = readline.createInterface({
                input     : sub.stderr,
            }).on('line', (line) => {
                console.log('stderr', line);
                if (!line.match(/^[0-9]{4}\-/)) {
                    let expectedLine = expected.stderr[stderr.length];
                    stderr.push(line);
                    t.same(line, expectedLine, 'stderr line '+(stderr.length)+' should be "'+expectedLine+'"');
                }
            });

            sub.on('exit', function (code) {
                t.same(code, expected.exitCode, 'exit code should be '+expected.exitCode);
                t.same(stderr.length, expected.stderr.length, 'stderr line count should match '+expected.stderr.length);
                t.same(stdout.length, expected.stdout.length, 'stdout line count should match '+expected.stdout.length);

                t.end();
                rlStdout.close();
                rlStderr.close();
                next();
            });
        });
    });
}

testsStart();
