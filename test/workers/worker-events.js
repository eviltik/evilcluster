const cluster = require('cluster');

cluster.onEvent('clusterReady', () => {
    cluster.sendEvent('master:spawnToMasterOnly');
    cluster.sendEvent('spawnToBothMasterAndSpawn');
});

setTimeout(() => {
    process.exit();
}, 5000);
