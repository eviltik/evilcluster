const EventEmitter = require('events').EventEmitter;
const cluster = require('cluster');
const path = require('path');
const spawn = require('child_process').spawn;
const async = require('async');

class Evilcluster extends EventEmitter {

    constructor(mainFile, workersDir) {
        super();

        this.EV_FORKED = 'ec.forked';
        this.EV_SPAWNED = 'ec.spawned';
        this.EV_ERROR = 'ec.error';
        this.EV_READY = 'ec.ready';
        this.EV_CLUSTER_READY = 'clusterReady';

        cluster.onEvent = this.onEvent.bind(this);
        cluster.sendEvent = this.sendEvent.bind(this);

        this.config = {
            argz: require('minimist')(process.argv.slice(2)),
            mainFile: mainFile,
            binPath: path.resolve(process.execPath),
            workersDir:workersDir || path.dirname(mainFile)
        };

        if (workersDir && workersDir.match(/^[a-z0-9]/i)) {
            this.config.workersDir = path.dirname(mainFile)+'/'+workersDir;
        }

        this.config.clusterArgs = JSON.parse(JSON.stringify(process.argv));

        // remove node binary
        this.config.clusterArgs.shift();

        // remove js file
        this.config.clusterArgs.shift();

        this.config.spawnOptions = {
            // windowsHide: false when using node, true when running in a packaged binary (see pkg module)
            windowsHide: !this.config.binPath.match(/node/),
            stdio: 'inherit',
        };

        this.config.evileventsOptions = {
            transport:'tcp', // never use ipc due a limitation in evilevents atm
            verbose:false
        };

        if (process.env.EE_PORT_TO_MASTER) {
            this.config.evileventsOptions.tcpPortToMaster = process.env.EE_PORT_TO_MASTER;
        }

        if (process.env.EE_PORT_FROM_MASTER) {
            this.config.evileventsOptions.tcpPortFromMaster = process.env.EE_PORT_FROM_MASTER;
        }

        this.config.evileventsOptions.forkId = this.config.argz.worker||'master';

        cluster.isLastFork = false;

        if (!this.isSpawn() && !this.isFork()) {

            cluster.isMain = true;
            cluster.isSpawn = false;
            cluster.isFork = false;
            cluster.cid = 'main';
            process.on('exit', this.killSpawns.bind(this));

        } else if (this.isSpawn()) {

            cluster.forceClient = true;
            cluster.isSpawn = true;
            cluster.isFork = false;
            cluster.isMain = false;
            cluster.cid = this.config.argz.worker;

        } else if (this.isFork()) {

            cluster.isSpawn = false;
            cluster.isFork = true;
            cluster.isLastFork = this.config.argz.forkNumber === this.config.argz.maxForks;
            cluster.isMain = false;
            cluster.forkNumber = this.config.argz.forkNumber;
            cluster.cid = this.config.argz.worker+':'+cluster.forkNumber;

            this.config.evileventsOptions.forkId = this.config.argz.worker+'#'+cluster.forkNumber;

        }

        //console.log('init', cluster.cid, 'isSpawn',this.isSpawn(), 'isFork',this.isFork(), 'isLastFork',cluster. isLastFork);
        this.debug = require('debug')('evilcluster:'+cluster.cid);
        this.debug('argz',this.config.argz);

        this.ee = require('evilevents');
        cluster.ec = this;

    }

    onEvent(eventName, fnc) {

        this.debug('onEvent',eventName);

        this.ee.on(eventName, (eventName, data) => {
            if (data!=undefined) {
                this.debug('onEvent received %s %s', eventName, JSON.stringify(data));
            } else {
                this.debug('onEvent received %s', eventName);
            }
            fnc(eventName, data);
        });
    }

    isSpawn() {
        return this.config.argz.worker && !this.config.argz.forkNumber;
    }

    isFork() {
        if (parseInt(this.config.argz.forkNumber)) return true;
        return false;
    }

    runCode(callback) {

        this.ee.client.connect(this.config.evileventsOptions,(err) => {

            if (err && callback) {
                this.debug('runCode error', err);
                return callback(err);
            }

            let file = path.resolve(this.config.workersDir+'/'+this.config.argz.worker);
            try {
                this.debug('runCode require', file);
                require(file);
            } catch(e) {
                this.sendEvent(this.EV_ERROR, e.stack);
                process.exit(1);
            }

            callback && callback();
        });
    }

    respawnWorker(workerId) {

        this.debug(
            'respawnWorker %s in %s',
            workerId,
            this.workers[workerId].respawnNextInterval,'ms'
        );

        setTimeout(()=>{
            this.spawnWorker(workerId);
        },this.workers[workerId].respawnNextInterval);
    }

    onWorkerError(workerSpawn, err) {
        this.debug('onWorkerError',err);
        this.respawnWorker(workerSpawn.id);
    }

    onWorkerClose(workerSpawn, exitCode) {
        if (exitCode>0) {
            this.debug(
                'onWorkerClose %s exit with code %s, trigger respawnWorker',
                workerSpawn.id,
                exitCode
            );
            this.respawnWorker(workerSpawn.id + '');
            return;
        }

        workerSpawn.killed = true;
        this.debug(
            'onWorkerClose %s exit normally (0), dont trigger respawnWorker',
            workerSpawn.id
        );
    }

    spawnWorker(workerId, callback) {

        let wk = this.workers[workerId];

        if (wk.disable) {
            return callback && callback();
        }

        let args = [];

        process.execArgv.forEach((arg) => {
            args.push(arg);
        })

        args.push(this.config.mainFile);
        args.push('--worker='+workerId);

        if (wk.maxForks) {
            args.push('--maxForks='+(wk.maxForks));
        }

        process.argv.forEach((arg) => {
            if (arg.match(/^\-\-/)) args.push(arg);
        })

        if (!wk.respawnInterval) {
            wk.respawnInterval = 1000;
            wk.respawnNextInterval = 1000;
        }

        if (wk.spawnCount) {
            if (wk.spawnCount<10) {
                wk.respawnNextInterval = wk.respawnInterval * wk.spawnCount;
            }
            wk.spawnCount++;
        } else {
            wk.spawnCount = 1;
        }

        let self = this;

        this.debug(
            'spawnWorker %s: binPath=%s, spawnOptions=%s',
            workerId,
            this.config.binPath,
            JSON.stringify(this.config.spawnOptions)
        );

        wk.spawn = spawn(this.config.binPath, args, this.config.spawnOptions);

        wk.spawn.id = workerId;

        wk.spawn.on('close', function (exitCode) {
            self.onWorkerClose(this, exitCode);
        });

        wk.spawn.on('error', function(err) {
            self.onWorkerError(this, err);
        });

        callback && callback();
    }

    spawnWorkers(callback) {

        this.debug('spawnWorkers');

        this.spawned = 0;

        let workersCount = 0;
        let firstWorkerId;
        for (let workerId in this.workers) {
            if (!this.workers[workerId].disable) {
                if (!firstWorkerId) {
                    firstWorkerId = workerId;
                }
                workersCount++;
            } else {
                this.debug('spawnWorkers: %s is disabled',workerId);
            }
        }

        this.onEvent(this.EV_SPAWNED, (ev, data) => {
            this.spawned++;
            if (this.spawned === workersCount) {
                this.sendEvent('master:'+this.EV_READY);
            } else {
                // spawn next worker
                this.spawnWorker(Object.keys(this.workers)[this.spawned]);
            }
        });

        // spawn first worker
        if (firstWorkerId) this.spawnWorker(firstWorkerId);
        callback && callback();
    }

    killSpawns() {
        this.debug('killSpawns triggered');
        async.mapValues(
            this.workers,
            (worker, workerId, next) => {
                if (this.workers[workerId].spawn) {
                    if (!this.workers[workerId].spawn.killed) {
                        this.debug('killSpawns: %s => kill()', workerId);
                        this.workers[workerId].spawn.kill();
                    } else {
                        this.debug('killSpawns: %s => already killed', workerId);
                        // already killed
                    }
                } else {
                    this.debug('killSpawns: %s => no spawn ??', workerId);
                    // process is not yet spawned
                }
                next();
            }
        );
    }

    spawnFork() {

        let maxForks = parseInt(this.config.argz.maxForks);
        let workerId = this.config.argz.worker;

        if (cluster.forkNumber) {
            this.runCode(()=>{
                process.nextTick(()=>{
                    // send event to spawned master process (not the main process)
                    this.debug('forked, sending %s', workerId+':'+this.EV_FORKED);
                    this.sendEvent(workerId+':'+this.EV_FORKED,{forkNumber:cluster.forkNumber});
                });
            });
            return;
        }

        if (!maxForks) {
            this.runCode(()=> {
                // worker has no forks, spawn is ready
                process.nextTick(()=> {
                    this.debug('no forks required, sending master:'+this.EV_SPAWNED);
                    this.sendEvent('master:' + this.EV_SPAWNED, {forks:0});
                });
                this.sendEvent(workerId + ':' + this.EV_SPAWNED,{forks:0});
            });
            return;
        }


        // spawn have forks

        this.runCode(()=> {
            // worker has forks, wait for all forks to be ready
            this.workers[workerId].forked = 0;

            this.onEvent(this.EV_SPAWNED, () => {
                //setTimeout(() => {
                    this.debug('all forks has been forked, sending master:'+this.EV_SPAWNED);
                    this.sendEvent('master:' + this.EV_SPAWNED, {forks: this.workers[workerId].forked});
                //},0);
            });

            this.onEvent(this.EV_FORKED,(ev, data) => {
                this.workers[workerId].forked++;
                if (this.workers[workerId].forked == this.config.argz.maxForks) {
                    this.debug('all forks has been forked, sending '+workerId+':'+this.EV_SPAWNED);
                    this.sendEvent(workerId + ':' + this.EV_SPAWNED, {forks: this.workers[workerId].forked});
                }
            })

            cluster.setupMaster({
                args: this.config.clusterArgs,
                silent: false
            });

            for (let i = 0; i<maxForks; i++) {
                cluster.settings.args.push('--forkNumber='+(i+1));
                this.debug('forking',JSON.stringify(cluster.settings));
                cluster.fork();
                cluster.settings.args.pop();
            }

        });
    }

    start(workers) {

        this.workers = JSON.parse(JSON.stringify(workers));

        if (cluster.isSpawn || cluster.isFork) {
            cluster.options = this.workers[this.config.argz.worker].options || {};
            this.spawnFork();
            return;
        }

        this.onEvent(this.EV_READY,() => {
            // sent to all spawns and forks
            this.sendEvent(this.EV_CLUSTER_READY);
        });

        async.series([
            (next) => {
                this.ee.server.start(
                    this.config.evileventsOptions,
                    next
                );
            },
            (next) => {
                this.spawnWorkers(next)
            }
        ]);
    }

    sendEvilEvent(eventName, data) {

        if (data!=undefined) {
            this.debug('sendEvilEvent %s %s', eventName, JSON.stringify(data));
        } else {
            this.debug('sendEvilEvent %s', eventName);
        }

        if (cluster.isMain) {
            this.ee.server.send(eventName, data);
        } else {
            this.ee.client.send(eventName, data);
        }
    }

    sendEvent(eventName, data) {

        if (eventName.match(/ec\./)) {
            return this.sendEvilEvent(eventName, data);
        }

        if (eventName.match(/\#/)) {
            return this.sendEvilEvent(eventName, data);
        }

        if (!eventName.match(/:/)) {
            return this.sendEvilEvent(eventName, data);
        }

        if (eventName.match(/^master:/)) {
            return this.sendEvilEvent(eventName, data);
        }

        let tmp = eventName.split(':');
        let workerId = tmp[0];
        let evName = tmp[1];

        if (this.workers && this.workers[workerId]) {
            if (this.workers[workerId].maxForks) {
                // send to forks
                for (let i=1;i<=this.workers[workerId].maxForks;i++) {
                    this.sendEvilEvent(workerId+'#'+i+':'+evName, data);
                }
            }
            // send to spawned
            this.sendEvilEvent(eventName, data);
        } else {
            console.log('evilcluster error: trying to send event %s to an unexisting worker %s', eventName, workerId);
        }

    }

}

module.exports = Evilcluster;
