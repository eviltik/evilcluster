const cluster = require('cluster');

cluster.ec.onEvent('myEventForMasterAndMe', () => {
    tap.test(common.me, common.testOptions, (t) => {
        t.equal(
            cluster.isSpawn,
            true,
            'event should be received by the spawn'
        );
        t.end();
    });
});

setTimeout(()=>{

    cluster.ec.sendEvent('master:myEventToMaster');
    cluster.ec.sendEvent('myEventForMasterAndMe');

},200);

