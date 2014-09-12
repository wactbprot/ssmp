```
 ___ ___ _____ ___ 
|_ -|_ -|     | . |
|___|___|_|_|_|  _|
              |_|
```
server side mp
--------------


__ssmp__ steht für  server side measurement program.

__ssmp__  führt vordefinierte Abläufe (_recipes_) aus. Diese recipes
werden in Bereichen (_container_) bereitgestellt. Recipes bestehen
aus Teilaufgaben (_tasks_) die zur  parallelen oder sequenziellen
Abarbeitung angeordnet werden können.

Die Gesamtheit der container, recipes und tasks ist die Messprogrammdefinition
(_mpdef_);
diese besitzt eine id, die in allen urls gleich nach dem __ssmp__ port auftaucht.

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

## Abkürzungen

* MP ... Messprogramm
* KD ... Kalibrierdokument
* ```mpid``` ... Datenbank-id der MP-Definition
* ```kdid``` ... Datenbank-id des KD-Dokuments
* __ssmp__ ... server side MP
* API ... application programming interface (hier eine http-Adresse)

## Installation

```
$> git clone https://github.com/wactbprot/ssmp.git
$> cd ssmp
$> npm install
```

## Einzeiler

Nach der Installation kann ssmp mittels

```
npm run ssmp
```
gestartet werden. Ein erstes MP kann wie folgt geladen und gestartet werden:

```
curl -d '{"Mp":{"Container":[{"Ctrl":"load;mon","Definition":[[{"TaskName":"Common-wait"}]]}]}}' -X POST http://localhost:8001/bsp_mp
```
Das MP wird hier gleich mitgeschickt (```-X POST```). Es besteht aus nur einem
Container in der nur eine Task (namens ``` Common-wait ```) geladen
(```load```) und wiederholt gestartet werden soll (```mon``` kommt von
_monitoring_ ). Dieses MP hat nun auch die unter dem Abschnitt [Endpunkte](https://github.com/wactbprot/ssmp#endpunkte)
beschriebenen urls.  


## Gesamtablauf


Nach der Installation sind folgende Schritte sind bei einer
Kalibrierung/Messung abzuarbeiten: 

1.  Starten des Servers
2.  Laden des MP
3.  Bekanntgeben der KD (optional)
4.  Laden der MP-Abläufe
5.  Starten des MP

## Endpunkte

Nachfolgend eine Übersicht der Wichtigsten von __ssmp__ bereitgestellten API-Endpunkte:

___mpid___
* GET: ```http://server:port/mpid``` ... liefert Datenbankdefinition zurück
* PUT: ```http://server:port/mpid``` ...  Laden des MP
* POST: ```http://server:port/mpid``` ...  Laden des MP

___name___
* GET: ```http://server:port/mpid/name``` ... Name des MP

___standard___
* GET: ```http://server:port/mpid/standard``` ... MP gehöhrt zu diesem Standard

___state___
* GET: ```http://server:port/mpid/state``` ... Abarbeitungszustand
* GET: ```http://server:port/mpid/state/0``` ... Abarbeitungszustand des ersten Containers
* GET: ```http://server:port/mpid/state/0/0``` ... Abarbeitungszustand des
  ersten seriellen Schrittes des ersten Containers 

___definition___
* GET/PUT: ```http://server:port/mpid/definition``` ... Definition
* GET/PUT: ```http://server:port/mpid/definition/0``` ... analog state
* GET/PUT: ```http://server:port/mpid/definition/0/0``` ... analog state

___recipe___
* GET/PUT: ```http://server:port/mpid/recipe``` ... Rezept
* GET/PUT: ```http://server:port/mpid/recipe/0``` ... analog state
* GET/PUT: ```http://server:port/mpid/recipe/0/0``` ...analog state

___ctrl___
* GET/PUT: ```http://server:port/mpid/ctrl``` ... Kontrollstring
* GET/PUT: ```http://server:port/mpid/ctrl/0``` ... analog state
* GET/PUT: ```http://server:port/mpid/ctrl/0/0``` ... analog state

___description___
* GET/PUT: ```http://server:port/mpid/description/0``` ... Beschreibung des 1. Containers 

___title___
* GET/PUT: ```http://server:port/mpid/title/0``` ... Titel des 1. Containers

___onerror___
* GET/PUT: ```http://server:port/mpid/onerror/0``` ... Fehlerverhalten des 1. Containers

___id___
* GET: ```http://server:port/mpid/id``` ... angemeldete KD-ids


##  Starten des Servers

__ssmp__ wird durch den Aufruf ```ssmp [-P port]``` gestartet.

Schöner formatierte logs bekommt man mit: 
```
$> npm run ssmp
```
Weitere Details können mittels ```ssmp -h``` erfragt werden.


## Laden des Messprogramms

Die Definition eines MP geschieht im JSON Format. Sie sind zweckmäßiger
Weise in einer CouchDB als Dokumente abgelegt. Sie können auf 2 
verschiedene Arten dem __ssmp__ zur weiteren Abarbeitung übergeben werden:

### 1. POST

Mittels _http-POST_ : 

```
$> curl -X POST -d  '{_id:mpid ... }'  http://localhost:8001/mpid
```

Hierfür kann auch [csmp](https://github.com/wactbprot/csmp) benutzt werden:

```
$> cd csmp
$> bin/db_get -p dbname/mpid |  bin/mp_post -i mpid 
```

### 2. PUT


Mittels _http-PUT_ : 

```
$> curl -X PUT -d  'load'  http://localhost:8001/mpid
```

oder mit [csmp](https://github.com/wactbprot/csmp):


``` 
$> bin/mp_ini -i mpid -d load
```

## Übergeben der Kalibrierdokumente

Der konkrete Ablauf eines Messprogramms hängt auch von den zu kalibrierenden
Geräten ab. _Welche_ Geräte _wie_ kalibriert werden sollen, ist in den KD
festgelegt. __ssmp__ muss also die ids der KD kennen um aus diesen Dokumenten die
entsprechenden Informationen zu beziehen.

Das Bekanntgeben der KD-ids geschieht mittels des _id_ Endpunkts:

```
$> curl -X PUT -d 'load' http://localhost:8001/mpid/id/kdid
```
[csmp](https://github.com/wactbprot/csmp) stellt dazu die 
Programme ```mp_id+``` (Hinzufügen), ```mp_id-``` (Löschen) 
und ```mp_id``` (Übersicht) zur Verfügung.

Hinzufügen:
```
mp_id+ -i mpid -d cdid
```
Löschen
```
mp_id- -i mpid -d cdid
```
Übersicht
```
mp_id -i mpid 
```

## Erstellen und Laden der MP-Abläufe 

Nachdem  die KD dem __ssmp__ bekannt gegeben wurden, können die konkreten Abläufe
erstellt und geladen werden. Im Zuge dieses Prozesses wird der Endpunkt
```
http://localhost:8001/mpid/recipe
```
aufgefüllt, an dem die Ablaufdefinition mit den Tasks zu den Rezepten
zusammengestellt ist. 
Die Abläufe der einzelnen _container_ sind der MP-Definition unter dem Pfad 
```Mp.Container.Definition[S][P]``` mit _TaskName_ und
individuellen Ersetzungsanweisungen _Replace_ und _Use_
angegebenen. ```S``` und ```P``` stehen hier für sequentieller 
bzw. paralleler Schritt. Bsp.:

```javascript
{
"_id": "mpid",
	"Mp": {
		"Container": [
			{
               "Element": ["Documents"],
			   "Description": "periodically reads out all FM3/CE3 pressure devices",
               "Ctrl": "load;mon",
               "OnError": "fallback",
               "Definition": 
	S --------> [
      P -------->  [
                       {
                           "TaskName": "FM3_1T-read_out",
                           "Replace": {
                               "@exchpath": "FM3_1T_pressure",
                               "@token": "mon",
                               "@repeat": 10,
                               "@waittime": 500
                           }
                       },
                       {
                           "TaskName": "Combi_CE3-read_out",
               ---------> "Use": {
                               "Values": "thermovac1"
                           },
               --------->  "Replace": {
                               "@exchpath": "Combi_CE3_thermovac1_pressure",
                               "@token": "mon",
                               "@repeat": 10,
                               "@waittime": 1000
                           }
                       }
					   ...
					   
```


Aus diesen Beschreibungen werden dann von __ssmp__ die konkreten
Abläufe erstellt; dies geschieht durch die Aufforderung:

```
$> curl -X PUT -d 'load' http://localhost:8001/mpid/ctrl/0
```

Mit  [csmp](https://github.com/wactbprot/csmp) geht das so:

```
$> bin/mp_ctrl -i mpid -c 0 -d load
```
Weitere Details zum Laden finden sich 
in der   [load.js Dokumentation](https://github.com/wactbprot/ssmp/blob/master/doc/load.js.md).


## Starten des Messprogramms

Das Starten des Ausführens der oben geladenen Abläufe des 1. Containers
geschieht auch über die ```ctrl``` Schnittstelle:

```
$> curl -X PUT -d 'run' http://localhost:8001/mpid/ctrl/0
```

Die  [csmp](https://github.com/wactbprot/csmp)-Variante:

```
$> bin/mp_ctrl -i mpid -c 0 -d run
```

#### Ablaufkontrolle

_tasks_ können Schlüsselwörter (keys) besitzen,
die ihre Ausführing beeinflussen; das sind die keys 
```RunIf``` und ```StopIf```.

##### RunIf

Die "Formulierung" ```RunIf: "got_time.Value"``` bewirkt, dass
die _task_  ausgeführt wird, wenn der Wert unter 
dem Pfad _exchange.got___time.Value_ (ausführlich: 
http://localhost:8001/mpdef/exchange/got_time/Value)
zu ```true``` ausgewertet wird.
  
Die _task_:

```javascript
{
	Action      : "wait", 
	Comment     : "Ready in  1000 ms", 
	TaskName    : "Mp-cond_wait", 
	Exchange    : "wait_time.Value", 
	Id          : ["kdid-1","kdid-2","kdid-3","kdid-4"], 
	CuCo        : false, 
	MpName      : "Mp"
	RunIf       : "got_time.Value", 
}
```

wird gestartet, nachdem z.B.:

```
$> bin/mp_set -i mpdef -p  exchange/got_time/Value -d 'true'
```
ausgeführt wurde.

##### StopIf

```StopIf``` funktioniert ganz analog ```RunIf```: Die _task_ wird nicht
erneut ausgeführt, wenn der Wert unter dem Pfad ```exchange.pfill_ok.Value``` 
zu ```true``` ausgewertet werden kann.

### Anhalten des MP

In gleicher Weise funktioniert Stopp

```
$> bin/mp_ctrl -i mpid -c 0 -d stop
```

und Pause

```
$> bin/mp_ctrl -i mpid -c 0 -d pause
```

Nach einem ```stop``` wird der Ablauf von neuem begonnen;
```pause``` macht da weiter wo angehalten wurde.

### ctrl-Syntax

Die  Anweisung:

```
$> bin/mp_ctrl -i mpid -c 0 -d 'load;5:run'
```

lädt den Ablauf und startet ihn 5 mal. Es geht auch:

```
$> bin/mp_ctrl -i mpid -c 0 -d 'load;5:run,load;stop'
```

was den Ablauf läd, 5 mal den Zyklus ```run``` gefolgt von ```load``` 
(durch Komma getrennt) durchläuft und dann ```stop``` ausführt.



## Die Exchange Schnittstelle

### Exchange als Input

Hier ein Beispiel wie man im ```PostProcessing``` Teil einer _task_ das Schreiben
in die Exchange Schnittstelle veranlassen kann:

```javascript
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

s. [doc/receive.js.md](https://github.com/wactbprot/ssmp/blob/master/doc/receive.js.md)
bzw.  [utils.js.md#write_to_exchange](https://github.com/wactbprot/ssmp/blob/master/doc/utils.js.md#write_to_exchangemp-task-data-cb)
	
## __ssmp__ Rückgabewerte

Das Ergebnis von _http-GET_-Anfrage hängt von der Art des
zurückzubebenden Objektes (```x```) ab:

* wenn ```x``` ein ```string```, ```number```oder ```boolean``` ist, dann sieht
  das Ergebnis so aus: ```{result:x}``` (dies damit der _return value_ in
  jedem Fall JSON ist)

* ist ```x``` ein ```object``` oder ```array``` wird einfach ```x``` zurückgegeben
 
* gibt es keine der Anfrage entsprechende Daten wird mit ```{error:
  "Beschreibung des Grundes"}``` geantwortet

* ist die url unzulässig liefert eine Anfrage
  ```{"code":"MethodNotAllowedError","message":"GET is not allowed"}```

## ToDo

* nano raus (done)
* antworten mit {ok:true} nicht mit "ok" (<- now)


## Ideas

* Neuschreiben Erlang
* log DB Zweig

## Dokumentation & devel

```
$> cd ssmp
$> npm run doc
```
Es werden so im Verzeichniss [ssmp/doc](https://github.com/wactbprot/ssmp/tree/master/doc) markdown (Endung ```.md```) erstellt.

### Unit tests/ code coverage

Bei Uninttests werden die Ergebnisse die kleine Programmteile 
(units) bei Ausführung liefern mit Sollergebnissen verglichen. 
Dies soll der Verbesserung der code-Qualität dienen: 

```
$> cd ssmp
$> npm test
```
Die Ausgabe der Testergebnisse geschieht auf der Konsole;
im Verzeichnis ```ssmp/coverage``` werden html-Dateien erzeugt.


### all together
 
```
$> cd ssmp
$> npm run all-dev
```
