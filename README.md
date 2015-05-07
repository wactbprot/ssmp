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
diese besitzt eine id, die in allen urls gleich nach dem __ssmp__ port
auftaucht. __ssmp__ kann vollständig über http gesteuert und abgefragt
werden. Besonders wichtig sind hierbei die Endpunkte ```/ctrl``` und
```/exchange```. 

	```
   +-------------+              +-------------+
   | CouchDB     |              | nodeRelay   |
   |-------------|              |-------------|         +--------+
   | - mp-docs   |      http    | - TCP       +-------->|Device  |
   | - tasks     |    +-------->| - VXI       |<--------+        |
   | - kd-docs   |    | +-------+ - Rscript   |         +--------+
   |             |    | |       | - email     |
   +-----+-------+    | |       +-------------+
       ^ |            | v
       | |          +-+----------------+
       | |  http    |     ssmp         |
       | +--------->|------------------|
       +------------+  /exchange       |
                    |  /state          |
                    |  /ctrl           |
                    +--------+---------+
                           ^ |
                           | | http
                           | |
                           | v
                    +------+-----------+
                    |   client         |
                    |------------------|
                    | labVIEW          |
                    | Python           |
                    | js/http/css      |
                    +------------------+
```

## Abkürzungen

* ssmp ... server side MP
* MP ... Messprogramm
* KD ... Kalibrierdokument
* mpid ... Datenbank-id der MP-Definition (json-Dokument)
* kdid ... Datenbank-id des KD-Dokuments (json-Dokument)
* API ... application programming interface
* container ... Teilbereich eines MP indem Unterabläufe organisiert werden können

In den url-Schemata ist 
* ```C``` (zählt von 0 an) Nummer des containers
* ```S``` (zählt von 0 an) Nummer des sequentiellen Schritts
* ```P``` (zählt von 0 an) Nummer des parallelen Schritts

## API Endpunkte

Hier ein symbolischer Überblick über die von ssmp bereitgestellten
Schnittstellen. 

* ```/mpid/exchange``` ... Austausch von Daten client-server 
* ```/mpid/id``` ... Info über geladene KD
* ```/mpid/meta``` ... Informationen zum MP
* ```/mpid/C/ctrl``` ... Steuerung/ Übersicht des containers ```C```
* ```/mpid/C/state``` ... Zustand des containers C
* ```/mpid/C/state/S``` ... Zustand der ```S```. sequentiellen Schritte des
  containers ```C```
* ```/mpid/C/state/S/P``` ... Zustand des ```S```. sequentiellen und
  ```P```. parallelen Schritts des containers ```C```
*  ```/mpid/C/recipe``` ... recipe des containers ```C```
*  ```/mpid/C/recipe/S``` ...  analog state
*  ```/mpid/C/recipe/S/P``` ...  analog state

## Installation

```
$> git clone https://github.com/wactbprot/ssmp.git
$> cd ssmp
$> npm install
```

## Gesamtablauf

Nach der Installation sind folgende Schritte abzuarbeiten:

1.  Starten des Servers
2.  Laden des MP
3.  Bekanntgeben der KD (optional)
4.  Laden der MP-Abläufe
5.  Starten des MP


##  Starten des Servers

__ssmp__ wird durch den Aufruf ```ssmp [-P port]``` gestartet.

Schöner formatierte logs bekommt man mit:
```
$> npm run ssmp
```
Weitere Details können mittels ```ssmp -h``` erfragt werden.


## Laden des Messprogramms

Die Definition eines MP geschieht im JSON Format. Sie sind zweckmäßiger
Weise in einer CouchDB als Dokumente abgelegt und kann auf folgende Weise dem
__ssmp__ zur Abarbeiting übergeben werden:


```
$> curl -X PUT -d  'load'  http://localhost:8001/mpid
```

oder mit [csmp](https://github.com/wactbprot/csmp):


```
$> bin/mp_ini -i mpid -d load
```

## Löschen eines MP

Das Entfernen eines MP aus dem ssmp Speicher geschieht in analoger Weise:
 
```
$> curl -X PUT -d  'remove'  http://localhost:8001/mpid
```

oder mit [csmp](https://github.com/wactbprot/csmp):


```
$> bin/mp_ini -i mpid -d remove
```

## Übergeben der Kalibrierdokumente

Der konkrete Ablauf eines Messprogramms hängt auch von den zu kalibrierenden
Geräten ab. _Welche_ Geräte _wie_ kalibriert werden sollen, ist in den KD
festgelegt. __ssmp__ muss also die ids der KD kennen um aus diesen Dokumenten
die entsprechenden Informationen zu beziehen.

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

Nachdem  die KD dem __ssmp__ bekannt gegeben wurden, können die konkreten
Abläufe erstellt und geladen werden. Im Zuge dieses Prozesses wird der
Endpunkt
```
http://localhost:8001/mpid/C/recipe
```
aufgefüllt, an dem die Ablaufdefinition mit den Tasks zu den Rezepten
zusammengestellt sind.
Die Abläufe der einzelnen _container_ sind der MP-Definition unter dem Pfad
```Mp.Container[n].Definition[S][P]``` mit _TaskName_ und
individuellen Ersetzungsanweisungen _Replace_ und _Use_
angegebenen. (```S``` und ```P``` stehen wie oben beschrieben für sequentieller
bzw. paralleler Schritt.) Bsp.:

```javascript
{
"_id": "mpid",
    "Mp": {
        "Container": [
            {
               "Element": ["Documents"],
               "Description": "periodically reads out all FM3/CE3 pressure devices",
               "Ctrl": "load;mon",
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
                    "Use": {
                               "Values": "thermovac1"
                           },
                "Replace": {
                               "@exchpath": "Combi_CE3_thermovac1_pressure",
                               "@token": "mon",
                               "@repeat": 10,
                               "@waittime": 1000
                           }
                       }
```

Aus diesen Beschreibungen werden dann von __ssmp__ die konkreten
Abläufe erstellt; dies geschieht durch die Aufforderung:

```
$> curl -X PUT -d 'load' http://localhost:8001/mpid/0/ctrl
```

Mit  [csmp](https://github.com/wactbprot/csmp) geht das so:

```
$> bin/mp_ctrl -i mpid -c C -d load
```

Es gibt einige Zeichenketten die als Ersetzungen in den Ablaufdefinitionen immer
zur Verfüging stehen wie z.B. das aktuelle Jahr über ```@year``` oder die
aktuell ausgewählten KD-ids über ```@cdids```. (s. das
[dbmp README](https://github.com/wactbprot/dbmp))


## Starten des Messprogramms

Das Starten des Ausführens der oben geladenen Abläufe des 1. Containers
geschieht auch über die ```ctrl``` Schnittstelle:

```
$> curl -X PUT -d 'run' http://localhost:8001/mpid/C/ctrl
```

Die  [csmp](https://github.com/wactbprot/csmp)-Variante:

```
$> bin/mp_ctrl -i mpid -c C -d run
```

#### Ablaufkontrolle

_tasks_ können Schlüsselwörter (keys) besitzen,
die ihre Ausführung beeinflussen; das sind die keys
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
$> bin/mp_ctrl -i mpid -c C -d stop
```

Durch ein ```stop``` wird der **state aller Tasks auf ready** gesetzt.

### ctrl-Syntax

Die  Anweisung:

```
$> bin/mp_ctrl -i mpid -c C -d 'load;5:run'
```

lädt den Ablauf und startet ihn 5 mal. Es geht auch:

```
$> bin/mp_ctrl -i mpid -c C -d 'load;5:run,load;stop'
```

was den Ablauf läd, 5 mal den Zyklus ```run``` gefolgt von ```load```
(durch Komma getrennt) durchläuft und dann ```stop``` ausführt.



## Die Exchange Schnittstelle

### Exchange als Input

Hier ein Beispiel wie man im ```PostProcessing``` Teil einer _task_ das
Schreiben in die Exchange Schnittstelle veranlassen kann:

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
bzw.
[utils.js.md#write_to_exchange](https://github.com/wactbprot/ssmp/blob/master/doc/utils.js.md#write_to_exchangemp-task-data-cb)

## Rückgabewerte

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
