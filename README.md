```
 ___ ___ _____ ___ 
|_ -|_ -|     | . |
|___|___|_|_|_|  _|
              |_|

```


__ssmp__ steht für  __s__erver __s__ide __m__easurement __p__rogram.

Der ssmp server führt vordefinierte Abläufe (_recipes_) aus. Diese recipes
werden in Bereichen (_container_) bereitgestellt. Recipes bestehen
aus Teilaufgaben (_tasks_) die zur  parallelen oder sequenziellen
Abarbeitung angeordnet werden können.
Die Gesamtheit der container, recipes und tasks ist die Messprogrammdefinition
(_mpdef_);
diese besitzt eine id, die in allen urls gleich nach dem ssmp port auftaucht.

## Starten

ssmp wird durch den Aufruf ```ssmp [port]``` gestartet. Man erhält
eine schönere Formatierung der Ausgaben durch:
```
./ssmp [options] | ../node_modules/bunyan/bin/bunyan -l info
```
Weitere Details können mittels ```ssmp -h``` erfragt werden.

## Vorbereitung

Die oben eingeführten  Programmdefinitionen sind zweckmäßiger
Weise in einer CouchDB-Instanz abgelegt.
Die oben beschriebene 


```
curl -X POST -H content-type:application/json -d  '{"_id":"se3-mp",\
	"BelongsTo":"SE3"}' http://localhost:8000/se3-mp
```

or use [csmp](https://github.com/wactbprot/csmp)

### prepare a container (load)

In order to prepare a container to run the tasks 
(given in the containers recipe) one have to fetch
the task objects. This is done by sending the string
```load``` to the container which is intented to be loaded:

```
 curl -X PUT -d 'load' http://localhost:8001/mpdef/ctrl/0
```
At this process 

### run a container

The 
```
 curl -X PUT -d 'run' http://localhost:8001/mpdef/ctrl/0
```

### stop a container

```
 curl -X PUT -d 'stop' http://localhost:8001/mpdef/ctrl/0
```


TODO: describe the definition format:
* container
* element
* recipe
* task

## tasks

Tasks sind _json_-Objekte;
es sind die Parametersätze der auszuführenden Aufgaben.

-Bsp. wait ...

## ToDo

* einen API-Endpunkt, der Art:```-d run recipe/0/1/1```
  mit dem man  einzelne Tasks ausführen bzw. testen kann