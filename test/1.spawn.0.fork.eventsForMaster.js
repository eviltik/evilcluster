const ec = new (require('../'))(__filename, 'workers/');
const cluster = require('cluster');
const common = require('./common')(__filename);
const assert = require('assert');

let workers = {
    testWorkerEvents:{
        maxForks:0
    }
};

if (require.main === module) {

    function onSpawned(ev, data) {
        console.log(common.msg.mainReceiveSpawnedEvent);

        assert.equal(data._emitter, 'testWorkerEvents');
        console.log(common.msg.mainReceiveSpawnedEventControlEmitter);

        assert.equal(data.forks, workers[data._emitter].maxForks);
        console.log(common.msg.mainReceiveSpawnedEventControlForksCount);
    }

    if (cluster.isMain) {
        ec.onEvent('ready', common.onReadyExpectedNoExit);
        ec.onEvent('error', common.onErrorUnexpected);
        ec.onEvent('spawned', onSpawned);
    }

    ec.onEvent('spawnToMasterOnly', () => {
        assert.equal(cluster.isMain,true);
        assert.equal(cluster.isSpawn,false);
        assert.equal(cluster.isFork,false);
        console.log(common.msg.mainReceiveCustomEvent);
    });

    ec.start(workers);
    common.waitAndExit(400);

} else {

    module.exports = {
        expected:{
            stdout:[
                common.msg.mainReceiveSpawnedEvent,
                common.msg.mainReceiveSpawnedEventControlEmitter,
                common.msg.mainReceiveSpawnedEventControlForksCount,
                common.msg.mainReceiveReadyEvent,
                common.msg.mainReceiveCustomEvent
            ]
        }
    };

}