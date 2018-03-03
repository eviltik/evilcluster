const ec = new (require('../'))(__filename, 'workers/');
const cluster = require('cluster');
const assert = require('assert');
const common = require('./common')(__filename);

let workers = {
    "spawnUncauthexception1":{
        disable:false,
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
        cluster.onEvent(ec.EV_READY, common.onReadyExpectedNoExit);
        cluster.onEvent(ec.EV_ERROR, common.onErrorUnexpectedNoExit);
        cluster.onEvent(ec.EV_SPAWNED, onSpawned);
        cluster.onEvent(ec.EV_SPAWN_EXIT_ERROR, common.onSpawnExitErrorNoExit);
        cluster.onEvent(ec.EV_FORK_EXIT_ERROR, common.onForkExitErrorNoExit);
    }

    if (cluster.isSpawn) {

        cluster.onEvent(ec.EV_SPAWNED, () => {
            console.log(common.msg.spawnReceivedSpawnedEvent+' ('+cluster.cid+')');
        });

        cluster.onEvent(ec.EV_FORKED,() => {
            console.log(common.msg.spawnReceiveForkedEvent+' ('+cluster.cid+')');
        });

    }

    ec.start(workers);
    common.waitAndExit(10000);

} else {

    module.exports = {
        expected:{
            stdout:[
                common.msg.spawnReceivedSpawnedEvent+' (spawnUncauthexception1)',
                common.msg.mainReceiveSpawnedEvent,
                common.msg.mainReceiveSpawnedEventControlEmitter,
                common.msg.mainReceiveSpawnedEventControlForksCount,
                common.msg.mainReceiveReadyEvent,
                common.msg.mainReceiveErrorEvent,
                common.msg.mainReceiveSpawnExitErrorEvent,
                common.msg.spawnReceivedSpawnedEvent+' (spawnUncauthexception1)',
                common.msg.mainReceiveSpawnedEvent,
                common.msg.mainReceiveSpawnedEventControlEmitter,
                common.msg.mainReceiveSpawnedEventControlForksCount,
                common.msg.mainReceiveErrorEvent,
                common.msg.mainReceiveSpawnExitErrorEvent,
                common.msg.spawnReceivedSpawnedEvent+' (spawnUncauthexception1)',
                common.msg.mainReceiveSpawnedEvent,
                common.msg.mainReceiveSpawnedEventControlEmitter,
                common.msg.mainReceiveSpawnedEventControlForksCount,
                common.msg.mainReceiveErrorEvent,
                common.msg.mainReceiveSpawnExitErrorEvent,
                common.msg.spawnReceivedSpawnedEvent+' (spawnUncauthexception1)',
                common.msg.mainReceiveSpawnedEvent,
                common.msg.mainReceiveSpawnedEventControlEmitter,
                common.msg.mainReceiveSpawnedEventControlForksCount,
                common.msg.mainReceiveErrorEvent,
                common.msg.mainReceiveSpawnExitErrorEvent,
            ]
        }
    };

}
