const ec = new (require('../'))(__filename, 'workers/');
const cluster = require('cluster');
const assert = require('assert');
const common = require('./common')(__filename);

let workers = {
    "forkUncauthexception1":{
        disable:false,
        maxForks:2
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
        cluster.onEvent(ec.EV_SPAWN_EXIT_NORMALY, common.onSpawnExitNormaly);
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

    if (process.env.TRAVIS) {
        module.exports = {
            expected:{
                stdout:[
                    common.msg.spawnReceiveForkedEvent+' (forkUncauthexception1)',
                    common.msg.spawnReceiveForkedEvent+' (forkUncauthexception1)',
                    common.msg.spawnReceivedSpawnedEvent+' (forkUncauthexception1)',
                    common.msg.mainReceiveSpawnedEvent,
                    common.msg.mainReceiveSpawnedEventControlEmitter,
                    common.msg.mainReceiveSpawnedEventControlForksCount,
                    common.msg.mainReceiveReadyEvent,
                    common.msg.mainReceiveErrorEvent,
                    common.msg.mainReceiveForkExitErrorEvent,
                    common.msg.mainReceiveErrorEvent,
                    common.msg.mainReceiveForkExitErrorEvent,
                    common.msg.spawnReceiveForkedEvent+' (forkUncauthexception1)',
                    common.msg.spawnReceiveForkedEvent+' (forkUncauthexception1)',
                    common.msg.mainReceiveErrorEvent,
                    common.msg.mainReceiveForkExitErrorEvent,
                    common.msg.mainReceiveErrorEvent,
                    common.msg.mainReceiveForkExitErrorEvent,
                    common.msg.spawnReceiveForkedEvent+' (forkUncauthexception1)',
                    common.msg.spawnReceiveForkedEvent+' (forkUncauthexception1)',
                    common.msg.mainReceiveErrorEvent,
                    common.msg.mainReceiveForkExitErrorEvent,
                    common.msg.mainReceiveErrorEvent,
                    common.msg.mainReceiveForkExitErrorEvent,
                ]
            }
        };
    } else {
        module.exports = {
            expected:{
                stdout:[
                    common.msg.spawnReceiveForkedEvent+' (forkUncauthexception1)',
                    common.msg.spawnReceiveForkedEvent+' (forkUncauthexception1)',
                    common.msg.spawnReceivedSpawnedEvent+' (forkUncauthexception1)',
                    common.msg.mainReceiveSpawnedEvent,
                    common.msg.mainReceiveSpawnedEventControlEmitter,
                    common.msg.mainReceiveSpawnedEventControlForksCount,
                    common.msg.mainReceiveReadyEvent,
                    common.msg.mainReceiveErrorEvent,
                    common.msg.mainReceiveForkExitErrorEvent,
                    common.msg.mainReceiveErrorEvent,
                    common.msg.mainReceiveForkExitErrorEvent,
                    common.msg.spawnReceiveForkedEvent+' (forkUncauthexception1)',
                    common.msg.spawnReceiveForkedEvent+' (forkUncauthexception1)',
                    common.msg.mainReceiveErrorEvent,
                    common.msg.mainReceiveForkExitErrorEvent,
                    common.msg.mainReceiveErrorEvent,
                    common.msg.mainReceiveForkExitErrorEvent,
                    common.msg.spawnReceiveForkedEvent+' (forkUncauthexception1)',
                    common.msg.spawnReceiveForkedEvent+' (forkUncauthexception1)',
                    common.msg.mainReceiveErrorEvent,
                    common.msg.mainReceiveForkExitErrorEvent,
                    common.msg.mainReceiveErrorEvent,
                    common.msg.mainReceiveForkExitErrorEvent,
                ]
            }
        };
    }
}
