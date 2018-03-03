const cluster = require('cluster');

if (cluster.isFork) {
    setTimeout(() => {
        // call undefined var
        uncauth2;
    },200);
}
