```
 ___ ___ _____ ___ 
|_ -|_ -|     | . |
|___|___|_|_|_|  _|
              |_|
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
## Dokumentation

```
$> cd ssmp
$> npm run doc
```
Es werden so im Verzeichniss ```ssmp/doc``` markdown 
(Endung ```.md```) erstellt.

## Unit tests/ code coverage
 
```
$> cd ssmp
$> npm test
```
Die Ausgabe der Testergebnisse geschieht auf der Konsole;
im Verzeichnis ```ssmp/coverage``` werden html-Dateien erzeugt.


## all together
 
```
$> cd ssmp
$> npm run all-dev
```

##  Starten des Servers

ssmp wird durch den Aufruf ```ssmp [-P port]``` gestartet.

Schöner formatierte logs bekommt man mit: 
```
$> npm run ssmp
```
Weitere Details können mittels ```ssmp -h``` erfragt werden.


## Vorbereitung des Messprogramms

Die oben eingeführten  Programmdefinitionen  sind zweckmäßiger
Weise in einer CouchDB-Instanz abgelegt. Sie können auf 2 
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

In gleicher Weise funktioniert Stopp

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

## recipes

s.  [doc/load.js.md](https://github.com/wactbprot/ssmp/blob/master/doc/load.js.md)


### Ablaufkontrolle

_tasks_ können Schlüsselwörter (keys) besitzen,
die ihre Ausführing beeinflussen; das sind die keys 
```RunIf`` und ```StopIf```.

#### RunIf

Die "Formulierung" ```RunIf: "got_time.Value"``` bewirkt, dass
die _task_  ausgeführt wird, wenn der Wert unter 
dem Pfad _exchange.got___time.Value_ (ausführlich: 
http://localhost:8001/mpdef/exchange/got_time/Value)
zu ```true``` ausgewertet wird.
  
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

wird gestartet, nachdem z.B.:

```
$> bin/mp_set -i mpdef -p  exchange/got_time/Value -d 'true'
```
ausgeführt wurde.

#### StopIf

```StopIf``` funktioniert ganz analog ```RunIf```: Die _task_ wird nicht
erneut ausgeführt, wenn der Wert unter dem Pfad ```exchange.pfill_ok.Value``` 
zu ```true``` ausgewertet werden kann.

## Die Exchange Schnittstelle

### Input

Hier ein Beispiel wie man im ```PostProcessing``` Teil einer _task_ das Schreiben
in die Exchange Schnittstelle veranlassen kann:

```
"PostProcessing": [
               "var ok = calculate_ok_from_input,",
               "ToExchange={'key.is.exchange.path':ok};"
           ]
```
Die ```receive()``` Funktion bekommt das unter

```
data.ToExchange
```
und würde hier den wert von ```ok``` in den Pfad ```key.is.exchange.path```
schreiben.

s. [doc/receive.js.md](https://github.com/wactbprot/ssmp/blob/master/doc/receive.js.md) bzw. [utils.js.md#write_to_exchange](https://github.com/wactbprot/ssmp/blob/master/doc/utils.js.md#write_to_exchangemp-task-data-cb)
	
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


## Ideas

* Neuschreiben Erlang
* log DB Zweig

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
