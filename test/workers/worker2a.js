const cluster = require('cluster');

if (cluster.isSpawn) {

    cluster.ec.onEvent('clusterReady',function() {
        console.log('spawn: cluster is ready (worker2a)');
    });

    cluster.ec.onEvent('test', ()=> {
        console.log('spawn: test event received (worker2a)');
        cluster.ec.sendEvent('worker1a:test');
    });
}
