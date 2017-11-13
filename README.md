# evilcluster
Nodejs Cluster Manager

# what ?

This module facilitates the implementation of an architecture (process) below

```

    main process
          │
          │
 child_process.spawn()
          │
          ├───── worker 1
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
          ├───── worker 2
          │             │
          │        cluster.fork()
          │             │
          │             ├──── fork 1
          │             │
          │        cluster.fork()
          │             │
          │             └──── fork n
          ¦
          ¦

```

Example:

```

        my app
          │
          │
          ├───── webserver - frontend
          │             │
          │             ├──── fork 1
          │             │
          │             └──── fork n
          │
          ├───── webserver - api
          │             │
          │             ├──── fork 1
          │             │
          │             └──── fork n
          │
          ├───── in memory datastore (only one master process))
          │
          └───── background task manager

```


# why ?

It can be useful in some cases:
* when you "pkg" (https://github.com/zeit/pkg) your application
* when the logic of microservices is not appropriated (!)