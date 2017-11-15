const EventEmitter = require('events').EventEmitter;
const cluster = require('cluster');
const path = require('path');
const spawn = require('child_process').spawn;
const async = require('async');

class Evilcluster extends EventEmitter {

    constructor(mainFile, workersDir) {
        super();
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

        //console.log(this.config.argz);

        this.config.spawnOptions = {
            // windowsHide: false when using node, true when running in a packaged binary (see pkg module)
            windowsHide: !this.config.binPath.match(/node/),
            stdio: 'inherit',
        };

        this.config.evileventsOptions = {
            transport:'tcp', // never use ipc for moment
            verbose:false
        };

        this.config.evileventsOptions.forkId = this.config.argz.worker;

        if (!this.isSpawned() && !this.isForked()) {
            process.on('exit', this.killSpawns.bind(this));
        }

        if (this.isSpawned()) {
            cluster.forceClient = true;
            cluster.isSpawn = true;
            cluster.isFork = false;
        }

        if (this.isForked()) {
            cluster.isSpawn = false;
            cluster.isFork = true;
            cluster.forkNumber = this.config.argz.forkNumber;
            this.config.evileventsOptions.forkId = this.config.argz.worker+'#'+cluster.forkNumber;
        }

        this.cev = require('evilevents');
    }

    onEvent(eventName, fnc) {
        this.cev.on(eventName, fnc);
        this.on(eventName, fnc);
    }

    isSpawned() {
        return this.config.argz.worker;
    }

    isForked() {
        return this.config.argz.forkNumber;
    }

    runCode(callback) {

        this.cev.connect(this.config.evileventsOptions,(err) => {

            if (err && callback) return callback(err);

            try {
                require(path.resolve(this.config.workersDir+'/'+this.config.argz.worker));
            } catch(e) {
                this.sendEvent('error',e.stack);
                process.exit(1);
            }
            callback && callback();
        });
    }

    respawnWorker(workerId) {
        setTimeout(()=>{
            this.spawnWorker(workerId);
        },this.workers[workerId].respawnNextInterval);
    }

    onWorkerError(workerSpawn, err) {
        console.log(err);
        this.respawnWorker(workerSpawn.id);
    }

    onWorkerExit(workerSpawn, exitCode) {
        console.log('worker %s exit with code %s', workerSpawn.id, exitCode);
        this.respawnWorker(workerSpawn.id+'');
    }

    spawnWorker(workerId, callback) {

        let wk = this.workers[workerId];

        let args = [
            this.config.mainFile,
            '--worker='+workerId
        ];

        if (wk.maxForks) {
            args.push('--maxForks='+(wk.maxForks));
        }

        if (!wk.respawnInterval) {
            wk.respawnInterval = 1000;
            wk.respawnNextInterval = 1000;
        }

        if (wk.spawnCount) {
            if (wk.spawnCount<10) {
                wk.respawnNextInterval = wk.respawnInterval * wk.spawnCount;
                console.log("%s restartInterval %s", workerId, wk.respawnNextInterval);
            }
            wk.spawnCount++;
        } else {
            wk.spawnCount = 1;
        }

        let self = this;

        wk.spawn = spawn(this.config.binPath, args, this.config.spawnOptions);
        wk.spawn.id = workerId;

        wk.spawn.on('close', function (exitCode) {
            self.onWorkerExit(this, exitCode);
        });

        wk.spawn.on('error', function(err) {
            self.onWorkerError(this, err);
        });

        callback && callback();
    }

    spawnWorkers(callback) {

        this.spawned = 0;

        this.onEvent('spawned', (ev, data) => {
            this.spawned++;
            if (this.spawned === Object.keys(this.workers).length) {
                this.sendEvent('master:ready');
            }
        });

        async.mapValues(
            this.workers,
            (worker, workerId, next) => {
                this.spawnWorker(workerId, next);
            },
            callback
        );
    }

    killSpawns(callback) {
        async.mapValues(
            this.workers,
            (worker, workerId, next) => {
                this.workers[workerId].spawn && this.workers[workerId].spawn.kill();
                next();
            },
            callback
        );
    }

    spawnFork() {

        let maxForks = parseInt(this.config.argz.maxForks);
        let workerId = this.config.argz.worker;

        if (cluster.forkNumber) {
            this.runCode(()=>{
                process.nextTick(()=>{
                    // send event to spawned master process (not the main process)
                    this.sendEvent(workerId+':forked',{forkNumber:cluster.forkNumber});
                });
            });
            return;
        }

        if (!maxForks) {
            this.runCode(()=> {
                // worker has no forks, spawn is ready
                process.nextTick(()=> {
                    this.sendEvent('master:spawned');
                });
            });
            return;
        }

        this.runCode(()=> {
            // worker has forks, wait for all forks to be ready
            this.workers[workerId].forked = 0;
            this.onEvent('forked',(ev, data) => {
                this.workers[workerId].forked++;
                if (this.workers[workerId].forked == this.config.argz.maxForks) {
                    this.sendEvent('master:spawned',{forks:this.workers[workerId].forked});
                }
            })
        });

        cluster.setupMaster({
            args: this.config.clusterArgs,
            silent: false
        });

        for (let i = 0; i<maxForks; i++) {
            cluster.settings.args.push('--forkNumber='+(i+1));
            cluster.fork();
            cluster.settings.args.pop();
        }

    }

    start(workers) {

        this.workers = JSON.parse(JSON.stringify(workers));

        if (this.isSpawned()) {
            this.spawnFork();
            return;
        }

        async.series([
            (next) => {
                this.cev.startServer(
                    this.config.evileventsOptions,
                    next
                );
            },
            (next) => {
                this.spawnWorkers(next)
            }
        ], () => {

        });
    }

    clusterEventInfo() {
        return this.cev.info();
    }

    getInfo() {
        if (this.config.argz.worker) {
            return {
                'worker':true,
                'spawn':this.config.argz.worker
            }
        } else {
            return {
                'main':true
            }
        }
    }

    sendEvent(eventName, data) {
        this.cev.send(eventName, data);
    }

}

module.exports = Evilcluster;