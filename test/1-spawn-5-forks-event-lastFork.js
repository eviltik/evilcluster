const ec = new (require('../'))(__filename, 'workers/');
const cluster = require('cluster');
const assert = require('assert');
const common = require('./common')(__filename);

let workers = {
    testWorker1:{
        maxForks:5
    }
};

if (require.main === module) {

    function onSpawned(ev, data) {
        console.log(common.msg.mainReceiveSpawnedEvent);

        assert.equal(data._emitter, 'testWorker1');
        console.log(common.msg.mainReceiveSpawnedEventControlEmitter);

        assert.equal(data.forks, workers.testWorker1.maxForks);
        console.log(common.msg.mainReceiveSpawnedEventControlForksCount);
    }

    if (cluster.isMain) {
        ec.onEvent('ready', common.onReadyExpectedNoExit);
        ec.onEvent('error', common.onErrorUnexpected);
        ec.onEvent('spawned', onSpawned);
    }

    if (cluster.isSpawn) {

        ec.onEvent('spawned', () => {
            console.log(common.msg.spawnReceivedSpawnedEvent);
        });

        ec.onEvent('forked',() => {
            console.log(common.msg.spawnReceiveForkedEvent);
        });
    }

    if (cluster.isFork && cluster.isLastFork) {
        // just ensure that this line is the last in the console
        // only needed for tests
        setTimeout(()=> {
            console.log(common.msg.forkIsLast);
        },600);
    }

    ec.start(workers);
    common.waitAndExit(2000);

} else {

    module.exports = {
        expected:{
            stdout:[
                common.msg.spawnReceiveForkedEvent,
                common.msg.spawnReceiveForkedEvent,
                common.msg.spawnReceiveForkedEvent,
                common.msg.spawnReceiveForkedEvent,
                common.msg.spawnReceiveForkedEvent,
                common.msg.spawnReceivedSpawnedEvent,
                common.msg.mainReceiveSpawnedEvent,
                common.msg.mainReceiveSpawnedEventControlEmitter,
                common.msg.mainReceiveSpawnedEventControlForksCount,
                common.msg.mainReceiveReadyEvent,
                common.msg.forkIsLast
            ]
        }
    };

}