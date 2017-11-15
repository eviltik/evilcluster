const tap = require('tap');
const path = require('path');
const cluster = require('cluster');

var testFile;

var testOptions = {
    bail:true,
    timeout: 2000
};

function exit() {
    //tap.test(testFile, testOptions, (t) => {
        process.nextTick(() => {
            let str = 'isMain=' + cluster.isMain+', ';
            str+='isSpawn=' + cluster.isSpawn+', ';
            str+='isFork=' + cluster.isFork;
            str+='pid=' + process.pid;
            //t.pass('exiting ('+str+')');
            //t.end();
            process.exit(0);
        });
    //});
}

function waitAndExit(delay) {
    setTimeout(exit, delay);
}

function onErrorUnexpected(ev, error) {
    tap.test(testFile, testOptions, (t) => {
        t.fail('error event received by the master', error);
        t.bailout(error);
    });
}

function onReadyExpected(ev, data) {
    tap.test(testFile, testOptions, (t) => {
        t.pass('ready event received by the master');
        t.end();
        exit();
    });
}

function onReadyExpectedNoExit(ev, data) {
    /*
    tap.test(testFile, testOptions, (t) => {
        t.pass('ready event received by the master');
        t.end();
    });
    */
}

module.exports = function(testFileName) {
    testFile = path.basename(testFileName);
    return {
        testOptions:testOptions,
        me:testFile,
        onReadyExpected:onReadyExpected,
        onReadyExpectedNoExit:onReadyExpectedNoExit,
        onErrorUnexpected:onErrorUnexpected,
        exit:exit,
        waitAndExit:waitAndExit,
    }
};