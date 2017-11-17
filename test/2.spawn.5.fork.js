const ec = new (require('../'))(__filename, 'workers/');
const path = require('path');
const cluster = require('cluster');
const tap = require('tap');
const common = require('./common')(__filename);

let workers = {
    testWorker1:{
        maxForks:5
    },
    testWorker2:{
        maxForks:5
    }
};

function onSpawned(ev, data) {
    tap.test(common.me, common.testOptions, (t) => {
        t.pass('spawned event received by the master');

        t.match(
            data._emitter,
            /testWorker/,
            'spawned event emitter should be match worker id'
        );

        t.equal(
            data.forks,
            workers[data._emitter].maxForks,
            'number of fork should be equal to '+workers[data._emitter].maxForks
        );

        t.end();
    });
}

if (cluster.isMain) {
    ec.onEvent('ready', common.onReadyExpected);
    ec.onEvent('error', common.onErrorUnexpected);
    ec.onEvent('spawned', onSpawned);
}

if (cluster.isSpawn) {
    ec.onEvent('spawned', (ev,data) => {
        //console.log(ev,data);
        //@todo make test for this case ...
    });
}

ec.start(workers);
