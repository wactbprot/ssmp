```
 ___ ___ _____ ___ 
|_ -|_ -|     | . |
|___|___|_|_|_|  _|
              |_|
```
server side measurement program
--------------


__ssmp__  führt vordefinierte Abläufe (_recipes_) aus. Diese recipes
werden in Bereichen (_container_) bereitgestellt. Recipes bestehen
aus Teilaufgaben (_tasks_) die zur  parallelen oder sequenziellen
Abarbeitung angeordnet werden können.

Die Gesamtheit der container, recipes und tasks ist die Messprogrammdefinition
(_mpdef_).

Bei der mpdef handelt es sich um ein json-Document. Dieses ist in
der Datenbank (CouchDB) abgelegt.  Es besitzt eine id, die in allen
nachfolgend beschriebenen urls gleich nach dem Port
auftaucht.

__ssmp__ kann vollständig über http gesteuert und abgefragt werden. Besonders
wichtig sind hierbei die Endpunkte ```/ctrl``` und ```/exchange```. 

## Schema

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
                    |                  |
                    |                  |
                    |                  |
                    +------------------+
```

## Abkürzungen

* MP ... Messprogramm
* ssmp ... server side MP
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

* ```/mpid``` ... interne Representation des gesamten MP
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

1.  Starten von server, client, api
2.  Laden des MP (s. auch ```--load``` Startoption)
3.  Bekanntgeben der KD (optional)
4.  Laden der MP-Abläufe (in einem, mehreren oder allen containern)
5.  Starten des MP (in einem, mehreren oder allen containern)

##  Starten des Server/Clients 
### systemctrl

Auf den  Messrechnern wird der service automatisch beim Booten über systemctrl
gestartet. ```stop```, ```start``` oder ```restart``` geht dann wie üblich über:

```
$> systemctl stop 
$> systemctl start
$> systemctl restart

```

Die aktuellen Logausgaben erhält man mittels:

```
$> journalctl -u ssmp -f
```


##  Starten des Server/Clients
### manuell

```
$> npm start
```

startet alle Komponenten (```server```, ```clients``` und ```api```) in der 
richtigen Reihenfolge mit formatierten log-Ausgaben. Die Komponenten können
auch einzeln gestartet werden: 

__ssmp server__ wird durch den Aufruf ```bin/ssmp-server``` gestartet.

Schöner formatierte logs bekommt man mit:

```
$> npm run server
```
Das Starten der __ssmp clients__ (```load```, ```build```, ```run```, ```observe```, ...)
geschieht mittels:

```
$> npm run clients
```

Mit ```bin/clients -l mpid``` bzw. ```bin/clients --load mpid``` wird das MP mit der
id mpid gleich geladen; es kann so Punkt 2 des Gesamtablaufes übersprungen
werden. Bsp.:

```
$> bin/clients -l mpd-check | bunyan -l trace
```
 
Letztlich sollte noch die __api__ (http-Schnittstelle) gestartet werden:

```
$> npm run api
```


## Ports/Adressen

Aufgrund des modularen Aufbaus des Systems werden zwei
Serverprozesse an folgenden *Ports* gestartet:

* 8001: [api](http://localhost:8001/) 
* 9000: Datenserver (intern)

## Laden des Messprogramms

Die Definition eines MP liegt im JSON Format vor welch zweckmäßiger
Weise in einer CouchDB als Dokumente abgelegt sind. Sie kann auf folgende
Weise dem __ssmp__ zur Abarbeiting übergeben werden:

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

## Kalibrierdokumente

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
