const tap = require('tap');
const path = require('path');

var testFile;

function exit() {
    process.nextTick(() => {
        process.exit();
    });
}

function onErrorUnexpected(ev, error) {
    tap.test(testFile, (t) => {
        t.fail('error event received by the master', error);
        t.bailout(error);
    });
}

function onReadyExpected(ev, data) {
    tap.test(testFile, (t) => {
        t.pass('ready event received by the master');
        t.end();
        exit();
    });
}

module.exports = function(testFileName) {
    testFile = path.basename(testFileName);
    return {
        onReadyExpected:onReadyExpected,
        onErrorUnexpected:onErrorUnexpected
    }
};