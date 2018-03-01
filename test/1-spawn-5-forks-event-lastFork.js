const ec = new (require('../'))(__filename, 'workers/');
const cluster = require('cluster');
const assert = require('assert');
const common = require('./common')(__filename);

let workers = {
    "worker1":{
        maxForks:5
    }
};

if (require.main === module) {

    function onSpawned(ev, data) {
        console.log(common.msg.mainReceiveSpawnedEvent);

        assert.equal(data._emitter, "worker1");
        console.log(common.msg.mainReceiveSpawnedEventControlEmitter);

        assert.equal(data.forks, workers[data._emitter].maxForks);
        console.log(common.msg.mainReceiveSpawnedEventControlForksCount);
    }

    if (cluster.isMain) {
        cluster.onEvent(ec.EV_READY, common.onReadyExpectedNoExit);
        cluster.onEvent(ec.EV_ERROR, common.onErrorUnexpected);
        cluster.onEvent(ec.EV_SPAWNED, onSpawned);
    }

    if (cluster.isSpawn) {
        cluster.onEvent(ec.EV_FORKED,(ev, data) => {
            console.log(common.msg.spawnReceiveForkedEvent);
        });

        cluster.onEvent(ec.EV_SPAWNED,(ev, data) => {
            console.log(common.msg.spawnReceivedSpawnedEvent);
        });

    }

    if (cluster.isFork && cluster.isLastFork) {
        // just ensure that this line is the last in the console
        // only needed for tests
        setTimeout(()=> {
            console.log(common.msg.forkIsLast);
        }, 500);
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
