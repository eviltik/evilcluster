const ec = new (require('../'))(__filename);
const path = require('path');
const cluster = require('cluster');
const common = require('./common')(__filename);

let workers = {
    testWorker1:{
        maxForks:0
    }
};

if (require.main === module) {

    if (cluster.isMain) {

        function onReady(ev, data) {
            // should be never fired
            console.log(common.msg.mainReceiveReadyEvent);
        }

        function onError(ev, data) {
            console.log(common.msg.mainReceiveErrorEvent);
            process.exit();
        }

        ec.onEvent('ready', onReady);
        ec.onEvent('error', onError);
    }

    ec.start(workers);
    common.waitAndExit(400);

} else {

    module.exports = {
        expected:{
            stdout:[common.msg.mainReceiveErrorEvent]
        }
    };

}

