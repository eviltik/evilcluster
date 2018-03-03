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
    mainReceiveSpawnExitNormalyEvent:'main: spawn exit normaly event received',
    mainReceiveSpawnExitErrorEvent:'main: spawn exit error event received',
    mainReceiveForkExitNormalyEvent:'main: fork exit normaly event received',
    mainReceiveForkExitErrorEvent:'main: fork exit with error event received',
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
    console.log(error);
    process.exit();
}

function onErrorUnexpectedNoExit(ev, error) {
    console.log(msg.mainReceiveErrorEvent);
    //console.log('*** ERROR:',error.split('\n')[0].trim());
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

function onSpawnExitNormaly(ev, data) {
    console.log(msg.mainReceiveSpawnExitNormalyEvent);
    exit();
}

function onSpawnExitErrorNoExit(ev, data) {
    console.log(msg.mainReceiveSpawnExitErrorEvent);
}

function onForkExitNormalyNoExit(ev, data) {
    console.log(msg.mainReceiveForkExitNormalyEvent);
}

function onForkExitErrorNoExit(ev, data) {
    console.log(msg.mainReceiveForkExitErrorEvent);
}

module.exports = function(testFileName) {
    testFile = path.basename(testFileName);
    return {
        me:testFile,
        onReadyExpected:onReadyExpected,
        onReadyExpectedNoExit:onReadyExpectedNoExit,
        onErrorUnexpected:onErrorUnexpected,
        onErrorUnexpectedNoExit:onErrorUnexpectedNoExit,
        onSpawnExitNormaly:onSpawnExitNormaly,
        onSpawnExitErrorNoExit:onSpawnExitErrorNoExit,
        onForkExitNormalyNoExit:onForkExitNormalyNoExit,
        onForkExitErrorNoExit:onForkExitErrorNoExit,
        exit:exit,
        waitAndExit:waitAndExit,
        msg:msg
    }
};
