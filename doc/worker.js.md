

<!-- Start ./lib/worker.js -->

## _

## Die ```worker()``` Funktionen

Die ```worker()``` arbeiten ```task```s ab.

 Tasks sind _json_-Objekte; es sind die Parametersätze
 der ```worker()``` Functionen.

 Ein einfaches Bsp. für eine ```task``` ist Warten
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

In dieser ```task``` müssen noch die mit einem Unterstrich
beginnenden Zeichenketten (_strings_) also z.B. ```_waitfor``` und
```_waittime``` ersetzt werden; womit, kann an drei
verschiedenen Stellen (abhängig von den Anforderungen) angegeben werden:

#### Defaults

Ersetzung durch Angaben aus dem gleichen Objekt (z.B. im gleichen
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

## wait(mp, task, path, cb)

```wait()``` verzögert den Ablauf um die unter
```task.Value.WaitTime``` angegebene Zeit in ms.

### Params: 

* **Object** *mp* Messprog.-Objekt
* **Object** *task* Task-Objekt
* **Array** *path* Pfad Array
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

## readElement(mp, task, pfad, cb)

Die worker Funktion ```readElement()``` erlaubt es,
zur Laufzeit Einträge aus der _exchange_-Schnittstelle
auszulesen.

Anwendungsbeispiel: Ein Messgerät kann nicht
elektronisch ausgelesen werden; es sind Eingabefelder
erstellt, ausgefüllt und vom Client an _exchange_
zurückgesandt. Mir der Function  ```readElement()```
wird jetzt der Wert aus _exchange_ ausgelesen und in das
Kalibrierdokument geschrieben.

### Params: 

* **Object** *mp* Messprog.-Objekt
* **Object** *task* Task-Objekt
* **Array** *pfad* Pfad Array
* **Function** *cb* Callback Funktion

## select(mp, task, pfad, cb)

Die worker Funktion ```select()``` wählt auf Basis
der unter _exchange_ derzeitig vorhandenen Werte
(z.B. ```target_pfill.Value.value```
ein Folgerezept für den aufrufenden Container aus.
In der ```task``` muss die Rezeptklasse unter dem Pfad
```task.Value.RecipeClass``` gegeben sein.

### Params: 

* **Object** *mp* Messprog.-Objekt
* **Object** *task* Task-Objekt
* **Array** *pfad* Pfad Array
* **Function** *cb* Callback Funktion

## getList(mp, task, pfad, cb)

Die worker Funktion ```getList()```
holt Daten von einer Datenbank-List-Abfrage.
Die ```task``` benötigt die Einträge  ```task.ListName```
und ```task.ViewName```. Ergebnisse werden (wie schon beim
```noderelay()``` worker) der ```receive()```-Funktion übergeben.

Anwendungnsbeispiel: Datensätze zur Auswahl
eines Kalibrierdokuments.

### Params: 

* **Object** *mp* Messprog.-Objekt
* **Object** *task* Task-Objekt
* **Array** *pfad* Pfad Array
* **Function** *cb* Callback Funktion

<!-- End ./lib/worker.js -->

