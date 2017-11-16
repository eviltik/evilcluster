# evilcluster
[![Build Status](https://travis-ci.org/eviltik/evilcluster.svg?branch=master)](https://travis-ci.org/eviltik/evilcluster)
[![MIT Licence](https://badges.frapsoft.com/os/mit/mit.svg?v=103)](https://opensource.org/licenses/mit-license.php)

Monolithic approach of nodejs clustering.

# What ? why ?

Sometime, you can make the choice to not have a microservice architecture :
* when you "pkg" (https://github.com/zeit/pkg) your node application
* when the logic of microservices is not "appropriated" ( ... )
* when you want one "Windows Service" (see https://nssm.cc/) with all in one


# Design purposal

Below a classical design of microservices running on the same box.

Usualy, master processes and forks talk each other using IPC (process.send).
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


But **IF** you **DON'T NEED** scalability, and you **NEED** to **NOT** have many different
standalone processes, you are thinking about a monolithic architecture.

This module aims at a pseudo monolithic architecture. The main process **SPAWN** workers.
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
          ├─────── worker 3 (no fork needed)
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


# Inter-processes communication

(DOC/TODO)

