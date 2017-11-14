const tap = require('tap');
const path = require('path');

var testFile;

var testOptions = {
    timeout: 2000
};

function exit() {
    process.nextTick(() => {
        process.exit();
    });
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

module.exports = function(testFileName) {
    testFile = path.basename(testFileName);
    return {
        testOptions:testOptions,
        onReadyExpected:onReadyExpected,
        onErrorUnexpected:onErrorUnexpected
    }
};