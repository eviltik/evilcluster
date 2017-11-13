# evilcluster
Monolitic nodejs "Cluster" approach.

# what ? why ?

Sometime, you can make the choice to not have a microservice architecture :
* when you "pkg" (https://github.com/zeit/pkg) your node application
* when the logic of microservices is not "appropriated" ( ... )
* when you want one "Windows Service" (see https://nssm.cc/) with all in one


This module aims at a pseudo monolithic architecture. The main process SPAWN workers.
hen workers MAY FORKS when necessary (think about web server/api load balancing).


```
    main process
          │
          │
 child_process.spawn()
          │
          ├─────── worker 1
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
          ├─────── worker 2
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

Example:

```
        my app
          │
          │
          ├───── webserverFrontend
          │             │
          │             ├──── fork 1
          │             │
          │             └──── fork n
          │
          ├───── webserverApi
          │             │
          │             ├──── fork 1
          │             │
          │             └──── fork n
          │
          ├───── inMemoryDatastore (only one master process)
          │
          └───── backgroundTaskManager ...

```


# what about inter-processes communication ?

In our previous example, the webserveApi worker MAY need to speak with inMemoryDatastore, and vice versa.


