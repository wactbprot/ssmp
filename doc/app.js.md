

<!-- Start ./app.js -->

__Eingang__:
```
"Lass alle Hoffnung fahren"
```
-- Dante

In ```app.js``` wird der http-Server gestartet,
welcher die _REST_-Api des _ssmp_ zur Verfügung stellt.

__GET__

Alle http-GET Anfragen funktionieren nach dem  Schema:
```
http://server:port/id/structur/path
```
Mit ```id``` ist die id der Messprogrammdefinition (MPD) gemeint.
Es können prinzipiell "beliebig" viele  MPD betrieben werden.

Bsp. für GET-Anfrage:
```
http://localhost:8001/id/param/database
```

### Params: 

* **String** *url* url-Muster der Anfrage
* **Function** *f* Callback

__DELETE__

Die http-DELETE Anfragen funktionieren nach folgendem Muster:
```
http://server:port/id/structur/path
```
das löschen ganzer Strukturen ist nicht erlaubt; es muss
mind. ein Pfadelement geben

Bsp.:
```
http://localhost:8001/id/param
```
geht nicht
```
http://localhost:8001/id/param/database/name
```
funktioniert.

### Params: 

* **String** *url* url-Muster der Anfrage
* **Function** *f* Callback

__PUT__

Ein http-PUT geht so:
```
http://server:port/id/structur/path
```
eine Besonderheit ist:
```
http://server:port/mpid/cdid
```
wobei mit ```cdid```` die _calibration doc id_
gemeint ist.
Der PUT-request soll zusätzliche Infos über das Kalibbrierdokument
besorgen. Es ist deshalb eine Datenbankabfrage mit einem solchen PUT
verbunden (ist in diesem Punkt also
anders als ein normales PUT)

### Params: 

* **String** *url* url-Muster der Anfrage
* **Function** *f* Callback

PUT
http://server:port/id/structure/l1/...

PUT
http://server:port/id
- Initialisiert mp-Instanz
- startet observer

__POST__

```
http://server:port/id
```

Übernimmt MPD vom _body_ des  requests
Initialisiert die MP-Instanz und startet
die ```observer()```-Funktion

### Params: 

* **String** *url* url-Muster der Anfrage
* **Function** *f* Callback

<!-- End ./app.js -->

