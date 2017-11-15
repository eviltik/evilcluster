const ec = new (require('../'))(__filename, 'workers/');
const path = require('path');
const cluster = require('cluster');
const tap = require('tap');
const common = require('./common')(__filename);

let workers = {
    testWorkerEvents:{
        maxForks:5
    }
};

common.testOptions.timeout = 3000;

function onSpawned(ev, data) {
    tap.test(common.me, common.testOptions, (t) => {
        t.pass('spawned event received by the master');

        t.equal(
            data._emitter,
            'testWorkerEvents',
            'spawned event emitter should be worker id'
        );

        t.equal(
            data.forks,
            workers.testWorkerEvents.maxForks,
            'number of fork should be equal to '+workers.testWorkerEvents.maxForks
        );

        t.end();
    });
}

if (cluster.isMain) {
    ec.onEvent('ready', common.onReadyExpectedNoExit);
    ec.onEvent('error', common.onErrorUnexpected);
    ec.onEvent('spawned', onSpawned);

    var mainReceivedMyEventToMaster = 0;

    ec.onEvent('myEventToMaster', () => {
        mainReceivedMyEventToMaster++;
    });

    tap.test(common.me, common.testOptions, (t) => {
        setTimeout(()=> {
            // maxForks +1 because the spawned process send the event too
            t.equal(
                mainReceivedMyEventToMaster,
                workers.testWorkerEvents.maxForks+1,
                'event received by main process should be equal to '+(workers.testWorkerEvents.maxForks+1)
            );
            t.end();
            common.waitAndExit(200);
        },2000);
    });

}


ec.start(workers);
cluster.ec = ec;
