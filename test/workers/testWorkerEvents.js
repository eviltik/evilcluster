const cluster = require('cluster');

setTimeout(()=>{

    cluster.ec.sendEvent('master:myEventToMaster');
    cluster.ec.sendEvent('myEventForMasterAndMe');

},200);

