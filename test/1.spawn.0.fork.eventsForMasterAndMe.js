const ec = new (require('../'))(__filename, 'workers/');
const path = require('path');
const cluster = require('cluster');
const tap = require('tap');
const common = require('./common')(__filename);

let workers = {
    testWorkerEvents:{
        maxForks:0
    }
};

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
            undefined,
            'number of fork should be equal to undefined'
        );

        t.end();
    });
}

if (cluster.isMain) {
    ec.onEvent('ready', common.onReadyExpectedNoExit);
    ec.onEvent('error', common.onErrorUnexpected);
    ec.onEvent('spawned', onSpawned);

    ec.onEvent('myEventToMaster', () => {
        tap.test(common.me, common.testOptions, (t) => {
            t.equal(
                cluster.isMain,
                true,
                'event should be received only by the main process'
            );
            t.end();
        });
        common.waitAndExit(100);
    });


    ec.onEvent('myEventForMasterAndMe', () => {
        tap.test(common.me, common.testOptions, (t) => {
            t.equal(
                cluster.isMain,
                true,
                'event should be received by the main process'
            );
            t.end();
        });
    });
}


ec.start(workers);
cluster.ec = ec;
