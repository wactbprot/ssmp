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

Die oben eingeführten  Programmdefinitionen  sind zweckmäßiger
Weise in einer CouchDB-Instanz abgelegt. Sie werden durch ein
_http-POST_ in ssmp zur weiteren Abarbeitung wie folgt abgelegt: 

```
curl -X POST -H content-type:application/json -d  '{"_id":"id",\
	"BelongsTo":"SE3"}' http://localhost:8000/id
```

Hiefür kann auch [csmp](https://github.com/wactbprot/csmp) benutzt werden:

```
db_get -i db/id | mp_ini -i id
```


### Laden der recipes

Die Abläufe sind in den _mpdef_ nur mit Tasknamen
(und evtl. vorzunehmenden Ersetzungen) angegebenen.
Es ist nötig, aus diesen Beschreibungen die konkreten
Abläufe zu erstellen; die geschieht mittels:

```
 curl -X PUT -d 'load' http://localhost:8001/id/ctrl/0
```

Mit  [csmp](https://github.com/wactbprot/csmp) geht das so:

```
mp_ctrl -i id -c 0 -d load
```

### Ausführen, Anhalten Stoppen eines Ablaufs

Das Starten des Ausführen geschieht auch über die ```ctrl``` Schnittstelle:

```
 curl -X PUT -d 'run' http://localhost:8001/mpdef/ctrl/0
```

Die  [csmp](https://github.com/wactbprot/csmp)-Variante:

```
mp_ctrl -i id -c 0 -d run
```

In gleicher Weise funktioniert Stop

```
mp_ctrl -i id -c 0 -d stop
```

und Pause

```
mp_ctrl -i id -c 0 -d pause
```

Nach einem stop wird der Ablauf von neuem begonnen;
Pause macht da weiter wo angehalten wurde.




## tasks

Tasks sind _json_-Objekte;
es sind die Parametersätze der auszuführenden Aufgaben.

-Bsp. wait ...

## ToDo

* einen API-Endpunkt, der Art:```-d run recipe/0/1/1```
  mit dem man  einzelne Tasks ausführen bzw. testen kann
