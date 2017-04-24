```
 ___ ___ _____ ___
|_ -|_ -|     | . |
|___|___|_|_|_|  _|
              |_|
```

## server side measurement program

__ssmp__ is an interpreter for predefined sequences called _recipes_. They are
written in json format. Such recipes consist of building bloks called _tasks_.
Tasks  can be arranged for parallel or sequentiel execution. Recipes consisting
of tasks are the core of a measurement program definition (_mpdef_). mpdefs are
stored as CouchDB documents.

__ssmp__ is contolled by http requests. The most important end points
are ```http://<server>:<port>/<mpd id>/ctrl```
and ```http://<server>:<port>/<mpd id>/exchange```.

## scheme


```
   +-------------+              +-------------+
   | CouchDB     |              | nodeRelay   |
   |-------------|              |-------------|         +--------+
   | - mp-docs   |      http    | - TCP       +-------->|Device  |
   | - tasks     |    +-------->| - VXI       |<--------+        |
   | - cd-docs   |    | +-------+ - Rscript   |         +--------+
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
                           |                  |
                           |                  |
                           |                  |
                           +------------------+
```

## glossary and abbreviations

* mp ... measurement program
* mpd ... mp definition (json document)
* ssmp ... server side mp
* cd ... calibration document
* mpid ... database id of the  mp definition (json document)
* cdid ... database id of the  cd documents (json document)
* api ... application programming interface
* tasks ... mp building blocks, json structures with certain values
* recipes ... sequences of tasks
* container ... region of the mpd in which sub sequences can be organized
* ```C```  number of containers (counts from 0)
* ```S```  nummer of sequentiel step (counts from 0)
* ```P```  nummer of parallel step (counts from 0)

## api endpoints

Some important api endpoints are:

* ```/mpid``` ... internal representation of the entire mp
* ```/mpid/exchange``` ... server/server and client/server data exchange
* ```/mpid/id``` ... loaded cd
* ```/mpid/meta``` ... informations about a loaded mpd
* ```/mpid/C/ctrl``` ... controling (PUT) or state (GET) of container ```C```
* ```/mpid/C/state``` ... state of container ```C```
* ```/mpid/C/state/S``` ... state  of sequentiel step ```S```
      of container ```C```
* ```/mpid/C/state/S/P``` ... state of paralel step ```P```  
      of sequentiel step ```S``` of container ```C```
*  ```/mpid/C/recipe``` ... recipe of container ```C```
*  ```/mpid/C/recipe/S``` ...  analog state
*  ```/mpid/C/recipe/S/P``` ...  analog state

## installation

```
$> git clone https://github.com/wactbprot/ssmp.git
$> cd ssmp
$> npm install
```
 ---> todo: describe the systemctrl installation

## systemctrl

```
$> systemctl stop
$> systemctl start
$> systemctl restart

```

## logging

```
$> journalctl -u ssmp -f
```
## extension/tcplog

A TCP server providing low level log information is started per default. Start
a log client  by:

```
$> cd  ssmp
$> ./bin/log
```

## ports
ssmp is a modular system. It starts several services on the following ports:

* 9000: data server (internal)
* 8001: [api: the json interface to ssmp](http://localhost:8001/)
* 8002: [frame: simple web frontend](http://localhost:8002/)
* 8003: [info: info system](http://localhost:8003/)
* 8004: [web socket: provides a pub sub hub](http://localhost:8003/) used by
  the info system (internal)
* 8005: [log: log server](http://localhost:8005/)


## load a mpd

The mpd is a json document stored in a CouchDB database.
which name and location is given in the configuration file ```lib/conf.js```.

The low level way of loading a measurement definition document with the
database id ```mpid``` is:

```
$> curl -X PUT -d  'load'  http://localhost:8001/mpid
```

The same can be done by short commandline tools provided by
[csmp](https://github.com/wactbprot/csmp):

```
$> bin/mp_ini -i mpid -d load
```

## remove a mdp

A mpd can be removed by:

```
$> curl -X PUT -d  'remove'  http://localhost:8001/mpid
```

or by means of [csmp](https://github.com/wactbprot/csmp) with:


```
$> bin/mp_ini -i mpid -d remove
```

## calibration documents (cd)

Since the recipes
Der konkrete Ablauf eines Messprogramms hängt auch von den zu kalibrierenden
Geräten ab. _Wieviel_, _welche_ und _wie_ die Geräte kalibriert werden sollen,
wird am Anfang des Gesamtablaufs festgelegt. __ssmp__ muss also die ids der KD
kennen um aus diesen Dokumenten die entsprechenden Informationen zu beziehen.

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

## Vorbereitung der Messung

Nachdem  die KD dem __ssmp__ bekannt gegeben wurden, können die konkreten
Abläufe erstellt und geladen werden. Im Zuge dieses Prozesses wird aus der
_Definition_ zusammen mit den _Informationen aus den KD_ und den aus der
Datenbank bezogenen _Task_s das Rezept (_recipe_)
entwickelt. Dieses ist dann unter

```
http://localhost:8001/mpid/C/recipe
```

zugänglich. Die Rezepterzeugung wird mittels

```
$> curl -X PUT -d 'load' http://localhost:8001/mpid/0/ctrl
```
gestartet. Es gibt jedoch auch eine _task_, die dies erledigen kann.

Mit [csmp](https://github.com/wactbprot/csmp) geht das so:

```
$> bin/mp_ctrl -i mpid -c C -d load
```

## Starten einer Messung

Das Starten des Ausführens der oben geladenen Abläufe des ```C```. containers
geschieht über die ```ctrl``` Schnittstelle:

```
$> curl -X PUT -d 'run' http://localhost:8001/mpid/C/ctrl
```

Die  [csmp](https://github.com/wactbprot/csmp)-Variante:

```
$> bin/mp_ctrl -i mpid -c C -d run
```

### Anhalten einer Messung

In gleicher Weise funktioniert Stopp

```
$> curl -X PUT -d 'stop' http://localhost:8001/mpid/C/ctrl
```

oder

```
$> bin/mp_ctrl -i mpid -c C -d stop
```

Durch ein ```stop``` wird der **state aller Tasks auf ready** gesetzt.

### ctrl-Syntax

Um Teilabläufe mehrmals zu starten ist folgendes vorgesehen; die  Anweisung:

```
$> bin/mp_ctrl -i mpid -c C -d 'load;5:run'
```

lädt den Ablauf und startet ihn 5 mal. Es geht auch:

```
$> bin/mp_ctrl -i mpid -c C -d 'load;5:run,load;stop'
```

was den Ablauf läd, 5 mal den Zyklus ```run``` gefolgt von ```load```
(durch Komma getrennt) durchläuft und dann ```stop``` ausführt.

## Rückgabewerte der Exchange-Schnittstelle

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

## unit tests/code coverage

Bei __unit tests__ werden Ergebnisse, die kleine Programmteile
(units) bei Ausführung liefern, mit Sollergebnissen verglichen.
Viele dieser unit tests benötigen den Datenserver der vorher gestartet
werden muss.

```
$> cd ssmp
$> npm run server
```

In einem 2. Terminal:

```
$> cd ssmp
$> npm test
```

code coverage

Die Abdeckung des codes durch die unit tests, die __code coverage__, kann mit:

```
$> cd ssmp
$> npm run cover
```
überprüft werden.

```
$> cd ssmp
$> firefox coverage/lcov-report/index.html
```
