# evilcluster

![Node.js CI](https://github.com/eviltik/evilcluster/workflows/Node.js%20CI/badge.svg)
[![npm version](https://badge.fury.io/js/evilcluster.svg)](https://badge.fury.io/js/evilcluster)
[![MIT Licence](https://badges.frapsoft.com/os/mit/mit.svg?v=103)](https://opensource.org/licenses/mit-license.php)
[![Dependency Status](https://david-dm.org/eviltik/evilcluster.svg)](https://david-dm.org/eviltik/evilcluster)

Monolithic approach of nodejs clustering.

## What ? why ?

Sometime, you can make the choice to **not have** a microservice architecture :

* when you "pkg" (https://github.com/zeit/pkg) your nodejs application
* when the logic of microservices is not "appropriated" ( ... )
* when you want to have only one "Windows Service" (see https://nssm.cc/)
with all your modules inside


## Best practice microservice design

Below a classical design of microservices running on the same box.

Usually, master processes and forks talk each other using IPC (process.send).
Only a boolean (cluster.isMaster) is available to handle code running in
forks vs master process.

Process 1 can not speak natively with process 2 unless if you implement it,
a kind of gateway between them (webservices, websockets, tcp, redis, ...).
This is a best practice because of scalability and deployment facility.


```

  process 1
      │
      │
 cluster.fork()
      │
      ├──── fork 1
      │
 cluster.fork()
      │
      └──── fork n


  process 2
      │
      │
 cluster.fork()
      │
      ├──── fork 1
      │
 cluster.fork()
      │
      └──── fork n

```


## Monolithic design approach

Now, if you **NEED** to **NOT** have many different standalone processes,
you are thinking about a monolithic architecture, and you will have to
find a way to monitor spawned processes, speak between master/spawns/forks
processes, handle logs, ...

This (poc) module aims at a pseudo monolithic architecture. The main process **SPAWN** workers.
Then spawned workers **MAY FORKS**.

So:
* cluster.isMaster is true when it's the main process
* cluster.isSpawn is true when it's a spawned worker
* cluster.isFork is true when it's a fork of a spawned worker

```
    main process
          │
          │
 child_process.spawn()
          │
          ├───────── worker 1
          │             │
          │        cluster.fork()
          │             │
          │             ├──── fork 1
          │             │
          │        cluster.fork()
          │             │
          │             └──── fork n
          │
 child_process.spawn()
          │
          ├───────── worker 2
          │             │
          │        cluster.fork()
          │             │
          │             ├──── fork 1
          │             │
          │        cluster.fork()
          │             │
          │             └──── fork n
  child_process.spawn()
          │
          ├─────── worker 3 (no fork wanted)
          ¦
          ¦

```


Real example:

```
        my app
          │
          │
          ├── webserverFrontend
          │          │
          │          ├──── fork 1
          │          │
          │          └──── fork n
          │
          ├── webserverApi
          │          │
          │          ├──── fork 1
          │          │
          │          └──── fork n
          │
          ├── inMemoryDatastore (only one master process)
          │
          └── backgroundTaskManager ...

```


## Inter-processes communication

(DOC/TODO)

