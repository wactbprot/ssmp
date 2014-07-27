```
 ___ ___ _____ ___ 
|_ -|_ -|     | . |
|___|___|_|_|_|  _|
              |_|
```
## Überblick

```

                           +---------------+
                           |   node-relay  |
                           |---------------|             +--------------+
                           |               |     TCP     |              |
                           |               +-----VXI-----+   Devices    |
                           |               |     UDP     |              |
                           +--------+------+             +--------------+
                                    |
                                    |
                                http/json
                                    |
   +-------------+           +------+-----+
   |  CouchDB    |           |  ssmp      |
   |-------------|           |------------|              +--------------+
   |             +-http/json-|            |              |              |
   |             |           |            +--http/json---+   csmp       |
   |             |           |            |              |              |
   +-------------+           +----+-- ----+              +--------------+
                                  |
                                  |
                              http/json
                                  |
                            +-----+-------+
                            |  mpvs       |
                            |-------------|              +--------------+
                            |             |              |              |
                            |             +--http/html5--+   Browser    |
                            |             |              |              |
                            +-------------+              +--------------+

```
server side mp
--------------


__ssmp__ steht für  server side measurement program.

Der ssmp server führt vordefinierte Abläufe (_recipes_) aus. Diese recipes
werden in Bereichen (_container_) bereitgestellt. Recipes bestehen
aus Teilaufgaben (_tasks_) die zur  parallelen oder sequenziellen
Abarbeitung angeordnet werden können.

Die Gesamtheit der container, recipes und tasks ist die Messprogrammdefinition
(_mpdef_);
diese besitzt eine id, die in allen urls gleich nach dem ssmp port auftaucht.

## Installation

```
$> git clone https://github.com/wactbprot/ssmp.git
$> cd ssmp
$> npm install
```
## Unit tests/ code coverage
 
```
$> cd ssmp
$> npm test
```
opens firefox with the results

## Starten

ssmp wird durch den Aufruf ```ssmp [-P port]``` gestartet.

Schöner formatierte logs bekommt man mit: 
```
$> npm run ssmp
```
Weitere Details können mittels ```ssmp -h``` erfragt werden.


## Vorbereitung

Die oben eingeführten  Programmdefinitionen  sind zweckmäßiger
Weise in einer CouchDB-Instanz abgelegt. Sie können auf 3 
verschiedene Arten dem _ssmp_ zur weiteren Abarbeitung übergeben werden:

### 1. POST

Mittels _http-POST_ : 

```
$> curl -X POST -d  '{_id:mpdef ... }'  http://localhost:8001/id
```

Hierfür kann auch [csmp](https://github.com/wactbprot/csmp) benutzt werden:

```
$> cd csmp
$> bin/db_get -p dbname/mpid |  bin/mp_post -i id 
```

### 2. PUT


Mittels _http-PUT_ : 

```
$> curl -X PUT -d  'load'  http://localhost:8001/id
```

oder mit [csmp](https://github.com/wactbprot/csmp):


``` 
$> bin/mp_ini -i mpid -d load
```

### 3. Simulation

Wird die id ```sim``` zum Laden angegeben, 
wird eine einfache _ssmp_-interne
Messprogrammdefinition benutzt (s. ToDo):

```
$> curl -X PUT -d  'load'  http://localhost:8001/sim
```

### Übergeben der Kalibrierdokumente

Damit an die vorliegende Kalibrierung/Messung angepasste 
_recipes_ erstellt werden können,
ist es notwendig _ssmp_ die _id_s der Kalibrierdocumente (_kdid_) 
zu übergeben: 

```
$> curl -X PUT -d 'load' http://localhost:8001/mpid/id/kdid
```

[csmp](https://github.com/wactbprot/csmp) stellt dazu die 
Programme ```mp_id+``` (Hinzufügen), ```mp_id-``` (Löschen) 
und ```mp_id``` (Übersicht) zur Verfügung.


### Laden der recipes

Die Abläufe (_recipes_) der einzelnen _container_
sind der _mpdef_  mit _TaskName_n und
individuellen Ersetzungsanweisungen angegebenen/aufzufinden.

Es ist nötig, aus diesen Beschreibungen die konkreten
Abläufe zu erstellen; dies geschieht mittels:

```
$> curl -X PUT -d 'load' http://localhost:8001/mpid/ctrl/0
```

Mit  [csmp](https://github.com/wactbprot/csmp) geht das so:

```
$> bin/mp_ctrl -i id -c 0 -d load
```

### Ausführen, Anhalten und Stoppen eines Ablaufs

Das Starten des Ausführen geschieht auch über die ```ctrl``` Schnittstelle:

```
$> curl -X PUT -d 'run' http://localhost:8001/mpid/ctrl/0
```

Die  [csmp](https://github.com/wactbprot/csmp)-Variante:

```
$> bin/mp_ctrl -i id -c 0 -d run
```

In gleicher Weise funktioniert Stop

```
$> bin/mp_ctrl -i id -c 0 -d stop
```

und Pause

```
$> bin/mp_ctrl -i id -c 0 -d pause
```

Nach einem ```stop``` wird der Ablauf von neuem begonnen;
```pause``` macht da weiter wo angehalten wurde.

Die  Anweisung:

```
$> bin/mp_ctrl -i id -c 0 -d 'load;5:run'
```

läd den Ablauf und startet ihn 5 mal. Es geht auch:

```
$> bin/mp_ctrl -i id -c 0 -d 'load;5:run,load;stop'
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


### Ablaufkontrolle

_tasks_ können Schlüsselwörter (keys) besitzen,
die ihre Ausführing beeinflussen; das sind die keys 
```RunIf`` und ```StopIf```.

#### RunIf

Die "Formulierung" ```RunIf: "got_time.Value"``` bewirkt, dass
die _task_  ausgeführt wird, wenn der Wert unter 
dem Pfad _exchange.got___time.Value_ (ausführlich: 
http://localhost:8001/mpdef/exchange/got_time/Value)
zu true ausgewertet wird.
  
Die _task_:

```
{
	Action      : wait, 
	Comment     : "Ready in  1000 ms", 
	TaskName    : Mp-cond_wait, 
	Exchange    : wait_time.Value, 
	Id          : [], 
	CuCo        : false, 
	MpName      : Mp
	RunIf       : got_time.Value, 
}
```

wird gestartet, wenn z.B.:

```
$> bin/mp_set -i mpdef -p  exchange/got_time/Value -d 'true'
```
ausgeführt wird.

#### StopIf

```StopIf``` funktioniert ganz analog ```RunIf```: Die _task_ wird nicht
erneut ausgeführt, wenn der Wert unter dem Pfad ```exchange.pfill_ok.Value``` 
zu true ausgewertet werden kann.

	
## ssmp Rückgabewerte

Das Ergebnis von _http-GET_-Anfrage hängt von der Art des
zurückzubebenden Objektes (```x```) ab:

* wenn ```x``` ein ```string```, ```number```oder ```boolean``` ist, dann sieht
  das Ergebnis so aus: ```{result:x}``` (dies damit der _return value_ jedem Fall json
* ist ```x``` ein ```object``` oder ```array``` wird einfach ```x```
  ist)
* gibt es keine der Anfrage entsprechende Daten wird mit ```{error:
  "Beschreibung des Grundes"}``` geantwortet
* ist die url unzulässig liefert eine Anfrage
  ```{"code":"MethodNotAllowedError","message":"GET is not allowed"}```

## ToDo

* wohin mit repltask aka ein universelles utils
* jasmine anrufen

## Ideas

* Neuschreiben Erlang
* log DB Zweig