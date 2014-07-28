

<!-- Start ./lib/worker.js -->

## _

Die ```worker``` arbeiten die ```tasks``` ab.

Tasks sind von der Funktion
```run()``` schon auf 'object' getestet. Der 'state'
ist von ```run()``` auch schon auf 'working' gesetzt.

Author: wactbprot (thsteinbock@web.de)

## wait(mp, task, pfad, cb)

```wait()``` verzögert den Ablauf um die unter
```task.Value.WaitTime``` angegebene Zeit in ms.

### Params: 

* **Object** *mp* Messprog.-Objekt
* **Object** *task* Task-Objekt
* **Array** *pfad* Pfad Array
* **Function** *cb* Callback Funktion

<!-- End ./lib/worker.js -->

