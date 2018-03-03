const cluster = require('cluster');

if (cluster.isFork) {

    setTimeout(() => {
        process.exit()
    },1000);

}
