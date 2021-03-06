const ec = new (require('../'))(__filename, 'workers/');
const cluster = require('cluster');
const assert = require('assert');
const common = require('./common')(__filename);

let workers = {
    "worker1":{
        maxForks:0
    },
    "worker2":{
        maxForks:0
    }
};

if (require.main === module) {

    function onSpawned(ev, data) {
        console.log(common.msg.mainReceiveSpawnedEvent);

        assert.equal(typeof workers[data._emitter], 'object');
        console.log(common.msg.mainReceiveSpawnedEventControlEmitter);

        assert.equal(data.forks, workers[data._emitter].maxForks);
        console.log(common.msg.mainReceiveSpawnedEventControlForksCount);
    }

    if (cluster.isMain) {
        cluster.onEvent(ec.EV_READY, common.onReadyExpected);
        cluster.onEvent(ec.EV_ERROR, common.onErrorUnexpected);
        cluster.onEvent(ec.EV_SPAWNED, onSpawned);
    }

    if (cluster.isSpawn) {

        cluster.onEvent(ec.EV_SPAWNED, () => {
            console.log(common.msg.spawnReceivedSpawnedEvent+' ('+cluster.cid+')');
        });

    }

    ec.start(workers);
    common.waitAndExit(2000);

} else {

    module.exports = {
        expected:{
            stdout:[
                common.msg.spawnReceivedSpawnedEvent+' (worker1)',
                common.msg.mainReceiveSpawnedEvent,
                common.msg.mainReceiveSpawnedEventControlEmitter,
                common.msg.mainReceiveSpawnedEventControlForksCount,
                common.msg.spawnReceivedSpawnedEvent+' (worker2)',
                common.msg.mainReceiveSpawnedEvent,
                common.msg.mainReceiveSpawnedEventControlEmitter,
                common.msg.mainReceiveSpawnedEventControlForksCount,
                common.msg.mainReceiveReadyEvent
            ]
        }
    };

}
