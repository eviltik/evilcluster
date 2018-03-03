const cluster = require('cluster');

if (cluster.isSpawn) {
    setTimeout(() => {
        // call undefined var
        uncauth2;
    },200);
}
