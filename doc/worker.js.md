

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

### Ersetzungen

In dieser Task müssen noch die mit einem Unterstrich
beginnenden Zeichenketten (_strings_) also  ```_waitfor``` und
```_waittime``` esetzt werden. Womit diese ersetzt werden kann an drei
verschiedenen Stellen (abhängig von den Anforderungen) angegeben werden:

#### Defaults

Im gleichen Objekt (z.B. im gleichen
   CalibrationObject oder Standard ect.) unter dem key ```Defaults```

#### Replace
In einer Rezeptdefinition unter dem key ```Replace```

Ersetzungen, die unterhalb ```Replace``` angegeben sind, sind __vorrangig__
gegenüber den Ersetzungen in ```Defaults```. Wird
also eine Definition:

```
"Definition": [
               [
                   {
                       "TaskName": "Mp-wait",
                       "Replace": {
                           "_waittime": 300
                       }
                   }
               ],
               [
                   {
                       "TaskName": "Mp-wait",
                       "Replace": {
                           "_waittime": 300
                       }
                   }
               ]
           ]
```
abgearbeitet, wird 300 als ```waittime``` realisiert falls etwas
Anderes in den ```Defaults``` angegeben ist.

#### FromExchange

Direkt in der _task_ unter dem key ```FromExchange``` wobei
hier **Ersetzungen zur Laufzeit** vorgenommen werden. Darüber
hinaus kann ```FromExchange``` auch ein Array von Werten sein.

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

## noderelay(mp, task, pfad, cb)

(Mess-) Aufträge an den _node-relay_-server
werden an diesen mit der ```noderelay()```
Funktion gesandt. Eine erfolgreiche Antwort (```data```)
wird der Funktion ```receive()``` übergeben.

### Params: 

* **Object** *mp* Messprog.-Objekt
* **Object** *task* Task-Objekt
* **Array** *pfad* Pfad Array
* **Function** *cb* Callback Funktion

## addElement(mp, task, pfad, cb)

Die worker Funktion ```addElement()``` erlaubt es,
zur Laufzeit Einträge in der _exchange_-Schnittstelle
zu erstellen.

Anwendungsbeispiel: Ein Messgerät kann nicht
elektronisch ausgelesen werden; es müssen manuelle
Eingabefelder erstellt werden. Dazu ist
```addElement()``` gedacht.

### Params: 

* **Object** *mp* Messprog.-Objekt
* **Object** *task* Task-Objekt
* **Array** *pfad* Pfad Array
* **Function** *cb* Callback Funktion

<!-- End ./lib/worker.js -->

