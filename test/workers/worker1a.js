const cluster = require('cluster');

if (cluster.isSpawn) {

    cluster.ec.onEvent('clusterReady',() => {
        console.log('spawn: cluster is ready (worker1a)');
        cluster.ec.sendEvent("worker2a:test");
    });

    cluster.ec.onEvent('test',()=>{
        console.log('spawn: test event received (worker1a)');
    })

}
