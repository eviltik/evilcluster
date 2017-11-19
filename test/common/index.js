const path = require('path');
const cluster = require('cluster');
const assert = require('assert');

var testFile;

const msg = {
    mainReceiveErrorEvent:'main: error event received',
    mainReceiveSpawnedEvent:'main: spawned event received',
    mainReceiveSpawnedEventControlEmitter:'main: spawned event emitter should match worker id',
    mainReceiveSpawnedEventControlForksCount:'main: number of forks(s) should match worker settings',
    mainReceiveReadyEvent:'main: ready event received',
    mainReceiveCustomEvent:'main: custom event received',
    spawnReceivedSpawnedEvent:'spawn: spawned event received',
    spawnReceiveCustomEvent:'spawn: custom event received',
    spawnReceiveForkedEvent:'spawn: fork event received',
    forkIsLast:'fork: i am the last fork'
};

function exit() {
    process.nextTick(() => {
        let str = 'isMain=' + cluster.isMain+', ';
        str+='isSpawn=' + cluster.isSpawn+', ';
        str+='isFork=' + cluster.isFork;
        str+='pid=' + process.pid;
        //t.pass('exiting ('+str+')');
        //t.end();
        process.exit(0);
    });
}

function waitAndExit(delay) {
    setTimeout(exit, delay);
}

function onErrorUnexpected(ev, error) {
    console.log(msg.mainReceiveErrorEvent);
    process.exit();
}

function onReadyExpected(ev, data) {
    assert.equal(cluster.isMaster, true);
    assert.equal(cluster.isSpawn, false);
    assert.equal(cluster.isFork, false);
    console.log(msg.mainReceiveReadyEvent);
    exit();
}

function onReadyExpectedNoExit(ev, data) {
    console.log(msg.mainReceiveReadyEvent);
    // don't exit
}

module.exports = function(testFileName) {
    testFile = path.basename(testFileName);
    return {
        me:testFile,
        onReadyExpected:onReadyExpected,
        onReadyExpectedNoExit:onReadyExpectedNoExit,
        onErrorUnexpected:onErrorUnexpected,
        exit:exit,
        waitAndExit:waitAndExit,
        msg:msg
    }
};