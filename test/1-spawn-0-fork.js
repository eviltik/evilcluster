const ec = new (require('../'))(__filename, 'workers/');
const cluster = require('cluster');
const assert = require('assert');
const common = require('./common')(__filename);

let workers = {
    testWorker1:{
        maxForks:0
    }
};

if (require.main === module) {

    function onSpawn(ev, data) {
        console.log(common.msg.mainReceiveSpawnedEvent);

        assert.equal(data._emitter, 'testWorker1');
        console.log(common.msg.mainReceiveSpawnedEventControlEmitter);

        assert.equal(data.forks, workers[data._emitter].maxForks);
        console.log(common.msg.mainReceiveSpawnedEventControlForksCount);
    }

    if (cluster.isMain) {
        ec.onEvent('ready', common.onReadyExpected);
        ec.onEvent('error', common.onErrorUnexpected);
        ec.onEvent('spawned', onSpawn);
    }

    if (cluster.isSpawn) {
        ec.onEvent('spawned', () => {
            console.log(common.msg.spawnReceivedSpawnedEvent);
        });
    }

    ec.start(workers);
    common.waitAndExit(1000);

} else {

    module.exports = {
        expected:{
            stdout:[
                common.msg.spawnReceivedSpawnedEvent,
                common.msg.mainReceiveSpawnedEvent,
                common.msg.mainReceiveSpawnedEventControlEmitter,
                common.msg.mainReceiveSpawnedEventControlForksCount,
                common.msg.mainReceiveReadyEvent,
            ]
        }
    };

}