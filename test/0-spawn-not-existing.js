const ec = new (require('../'))(__filename);
const cluster = require('cluster');
const common = require('./common')(__filename);

let workers = {
    "bla":{
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

        cluster.onEvent(ec.EV_READY, onReady);
        cluster.onEvent(ec.EV_ERROR, onError);
    }

    ec.start(workers);
    common.waitAndExit(1000);

} else {

    module.exports = {
        expected:{
            stdout:[
                common.msg.mainReceiveReadyEvent,
                common.msg.mainReceiveErrorEvent
            ]
        }
    };

}
