const cluster = require('cluster');

setTimeout(()=>{

    cluster.ec.sendEvent('master:spawnToMasterOnly');
    cluster.ec.sendEvent('spawnToBothMasterAndSpawn');

},100);

