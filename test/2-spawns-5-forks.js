const ec = new (require('../'))(__filename, 'workers/');
const cluster = require('cluster');
const assert = require('assert');
const common = require('./common')(__filename);

let workers = {
    "worker1":{
        maxForks:5
    },
    "worker2":{
        maxForks:5
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
        ec.onEvent('ready', common.onReadyExpected);
        ec.onEvent('error', common.onErrorUnexpected);
        ec.onEvent('spawned', onSpawned);
    }

    if (cluster.isSpawn) {

        ec.onEvent('spawned', () => {
            console.log(common.msg.spawnReceivedSpawnedEvent+' ('+cluster.cid+')');
        });

        ec.onEvent('forked',() => {
            console.log(common.msg.spawnReceiveForkedEvent+' ('+cluster.cid+')');
        });
    }

    ec.start(workers);
    common.waitAndExit(2000);

} else {

    module.exports = {
        expected:{
            stdout:[
                common.msg.spawnReceiveForkedEvent+' (worker1)',
                common.msg.spawnReceiveForkedEvent+' (worker1)',
                common.msg.spawnReceiveForkedEvent+' (worker1)',
                common.msg.spawnReceiveForkedEvent+' (worker1)',
                common.msg.spawnReceiveForkedEvent+' (worker1)',
                common.msg.spawnReceivedSpawnedEvent+' (worker1)',
                common.msg.mainReceiveSpawnedEvent,
                common.msg.mainReceiveSpawnedEventControlEmitter,
                common.msg.mainReceiveSpawnedEventControlForksCount,
                common.msg.spawnReceiveForkedEvent+' (worker2)',
                common.msg.spawnReceiveForkedEvent+' (worker2)',
                common.msg.spawnReceiveForkedEvent+' (worker2)',
                common.msg.spawnReceiveForkedEvent+' (worker2)',
                common.msg.spawnReceiveForkedEvent+' (worker2)',
                common.msg.spawnReceivedSpawnedEvent+' (worker2)',
                common.msg.mainReceiveSpawnedEvent,
                common.msg.mainReceiveSpawnedEventControlEmitter,
                common.msg.mainReceiveSpawnedEventControlForksCount,
                common.msg.mainReceiveReadyEvent
            ]
        }
    };

}