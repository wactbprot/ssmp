```
 ___ ___ _____ ___ 
|_ -|_ -|     | . |
|___|___|_|_|_|  _|
              |_|

```


__ssmp__ steht für  server side measurement program.

Der ssmp server führt vordefinierte Abläufe (_recipes_) aus. Diese recipes
werden in Bereichen (_container_) bereitgestellt. Recipes bestehen
aus Teilaufgaben (_tasks_) die zur  parallelen oder sequenziellen
Abarbeitung angeordnet werden können.

Die Gesamtheit der container, recipes und tasks ist die Messprogrammdefinition
(_mpdef_);
diese besitzt eine id, die in allen urls gleich nach dem ssmp port auftaucht.

## Starten

ssmp wird durch den Aufruf ```ssmp [-P port]``` gestartet. Man erhält
eine schönere Formatierung der Ausgaben durch:
```
bin/ssmp [options] | node_modules/bunyan/bin/bunyan -l info
```
was das Gleiche wie
```
bin/nssmp
```
ist. Weitere Details können mittels ```ssmp -h``` erfragt werden.



## Vorbereitung

Die oben eingeführten  Programmdefinitionen  sind zweckmäßiger
Weise in einer CouchDB-Instanz abgelegt. Sie können auf 3 
verschiedene Arten dem _ssmp_ zur weiteren Abarbeitung übergeben werden:

### 1. POST

Mittels _http-POST_ : 

```
curl -X POST -d  '{_id:mpdef ... }'  http://localhost:8001/id
```

Hierfür kann auch [csmp](https://github.com/wactbprot/csmp) benutzt werden:

```
db_get -p dbname/mpid |  mp_post -i id 
```

### 2. PUT


Mittels _http-PUT_ : 

```
curl -X PUT -d  'load'  http://localhost:8001/id
```

oder mit [csmp](https://github.com/wactbprot/csmp):


``` 
mp_ini -i mpid -d load
```

### 3. Simulation

Wird die id ```sim``` zum Laden angegeben, 
wird eine einfache _ssmp_-interne
Messprogrammdefinition benutzt (s. ToDo):

```
curl -X PUT -d  'load'  http://localhost:8001/sim
```

### Übergeben der Kalibrierdokumente

Damit an die vorliegende Kalibrierung/Messung angepasste 
_recipes_ erstellt werden können,
ist es notwendig _ssmp_ die _id_s der Kalibrierdocumente (_kdid_) 
zu übergeben: 

```
 curl -X PUT -d 'load' http://localhost:8001/mpid/kdid
```

[csmp](https://github.com/wactbprot/csmp) hat dafür die Funktionen 
```mp_id+``` zum Hinzufügen, ```mp_id+``` zum Löschen und ```mp_id```
für eine Übersicht.


### Laden der recipes

Die Abläufe sind in den _mpdef_ nur mit Tasknamen
(und evtl. vorzunehmenden Ersetzungen) angegebenen.

Es ist nötig, aus diesen Beschreibungen die konkreten
Abläufe zu erstellen; die geschieht mittels:

```
 curl -X PUT -d 'load' http://localhost:8001/mpid/ctrl/0
```

Mit  [csmp](https://github.com/wactbprot/csmp) geht das so:

```
mp_ctrl -i id -c 0 -d load
```

### Ausführen, Anhalten und Stoppen eines Ablaufs

Das Starten des Ausführen geschieht auch über die ```ctrl``` Schnittstelle:

```
 curl -X PUT -d 'run' http://localhost:8001/mpid/ctrl/0
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

Nach einem ```stop``` wird der Ablauf von neuem begonnen;
```pause``` macht da weiter wo angehalten wurde.

Die  Anweisung:

```
mp_ctrl -i id -c 0 -d 'load;5:run'
```

läd den Ablauf und startet ihn 5 mal. Es geht auch:

```
mp_ctrl -i id -c 0 -d 'load;5:run,load;stop'
```

was den Ablauf läd, 5 mal den Zyklus ```run``` gefolgt von ```load``` 
(durch Komma getrennt) durchläuft und dann ```stop``` ausführt.  


## recipes und tasks

Tasks sind _json_-Objekte; es sind Parametersätze.

Ein einfaches Bsp. für eine task ist Warten:

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
In dieser Task müssen noch die mit einem Unterstrich 
beginnenden Zeichenketten (_strings_) also  ```_waitfor``` und
```_waittime``` esetzt werden. Womit diese ersetzt werden kann an zwei
verschiedenen Stellen angegeben werden.
1. Im gleichen Objekt (z.B. im gleichen CalibrationObject oder Standard ect.)
2. In einem Rezept unter dem key ```Replace```

Ersetzungen, die unterhalb ```Replace``` angegeben sind, sind __vorrangig__ 
gegenüber den Ersetzungen in ```Defaults```. Wird 
also eine Rezept 

```
"Recipe": [
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
abgearbeitet, wird 300 als waittime realisiert.
	

## ToDo

* abhängige Tasks
* stopIf -Tasks
* runIf -Tasks
* task laden simulieren