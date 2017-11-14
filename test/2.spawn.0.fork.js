const ec = new (require('../'))(__filename, 'workers/');
const path = require('path');
const cluster = require('cluster');
const tap = require('tap');
const common = require('./common/events')(__filename);

let workers = {
    testWorker1:{
        maxForks:0
    },
    testWorker2:{
        maxForks:0
    }
};

function onSpawned(ev, data) {
    tap.test(path.basename(__filename), common.testOptions, (t) => {
        t.pass('spawned event received by the master');

        t.match(
            data._emitter,
            /testWorker/,
            'spawned event emitter should be match worker id'
        );

        t.equal(
            data.forks,
            undefined,
            'number of fork should be equal to undefined'
        );

        t.end();
    });
}

if (cluster.isMaster && !cluster.isSpawn) {
    ec.onEvent('ready', common.onReadyExpected);
    ec.onEvent('error', common.onErrorUnexpected);
    ec.onEvent('spawned', onSpawned);
}

ec.start(workers);
