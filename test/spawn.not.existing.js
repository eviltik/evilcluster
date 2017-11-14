const ec = new (require('../'))(__filename);
const path = require('path');
const cluster = require('cluster');
const tap = require('tap');

let workers = {
    testWorker1:{
        maxForks:0
    }
};

function exit() {
    process.nextTick(() => {
        process.exit();
    });
}

function onReady(ev, data) {
    tap.test(path.basename(__filename), { timeout: 1000 }, (t) => {
        t.pass('ready event received by the master');
        t.end();
        exit();
    });
}

function onError(ev, data) {
    tap.test(path.basename(__filename), { timeout: 1000 }, (t) => {
        t.pass('error event received by the master');
        t.end();
        exit();
    });
}

if (cluster.isMaster && !cluster.isSpawn) {

    ec.onEvent('ready', onReady);
    ec.onEvent('error', onError);

}


ec.start(workers);
