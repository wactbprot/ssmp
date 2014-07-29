

<!-- Start ./lib/worker.js -->

## _

Die ```worker``` arbeiten ```tasks``` ab.

 Tasks sind _json_-Objekte; es sind Parametersätze für
```worker``` FunKtionen.

 Ein einfaches Bsp. für eine task ist Warten
(Auszug aus Messprogrammdefinition):

 ```
 "Name":"Mp",
 ...
 "Defaults": {
          "_waittime": 1000,
          "_waitfor": "Ready in",
          "_waitunit": "ms"
        },
 "Tasks":[
 	   {
 	    "Action": "wait",
 		"Comment": "_waitfor  _waittime ms",
 		"TaskName": "wait",
 	    "Value": {
 	             "WaitTime": "_waittime"
                  }
       },
 ...
 ```

__BTW:__
Die hier (bei den worker-Funktionen) ankommenden
Tasks sind von der aufrufenden Funktion
```run()``` schon auf 'object' getestet. Der ```state```
ist von ```run()``` auch schon auf ```working``` gesetzt.

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

