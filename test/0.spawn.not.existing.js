const ec = new (require('../'))(__filename);
const path = require('path');
const cluster = require('cluster');
const tap = require('tap');
const common = require('./common')(__filename);

let workers = {
    testWorker1:{
        maxForks:0
    }
};

function onReady(ev, data) {
    tap.test(common.me, common.testOptions, (t) => {
        t.pass('ready event received by the master');
        t.end();
        common.exit();
    });
}

function onError(ev, data) {
    tap.test(common.me, common.testOptions, (t) => {
        t.pass('error event received by the master');
        t.end();
        common.exit();
    });
}

if (cluster.isMain) {
    ec.onEvent('ready', onReady);
    ec.onEvent('error', onError);
}


ec.start(workers);
