

<!-- Start ./lib/net.js -->

## param(mp)

Liefert Datenbankverbindungsparameter.

### Params: 

* **Object** *mp* Messprog.-Objekt

## relay(mp)

Die Funktion ```relay()```
liefert das Options-Objekt,
das für Verbindungen mit dem  _relayServer_
benutzt wird.

Der Eintrag ```agent: false``` ist nötig um
einen
```
ECONNRESET
...
socket hang up
```
Fehler zu vermeiden. Bei der Benutzung
des _agent_ wird per default
die Anzahl der sockets auf 5 beschränkt.

### Params: 

* **Object** *mp* MP-Objekt

## task(mp)

Die Funktion ```task()```
liefert das Verbindungsobjekt für die
list:
```
POST: _list/listname/viewname
```

### Params: 

* **Object** *mp* Messprog.-Objekt

## list(mp, task)

Die Funktion ```list()```
liefert das Verbindungsobjekt für die
list:
```
GET: _list/listname/viewname?key=value
```

### Params: 

* **Object** *mp* Messprog.-Objekt
* **Object** *task* aufrufende Task

## wrtdoc(mp, id)

Die Funktion ```wrtdoc()```
liefert das Verbindungsobjekt für die
url:
```
PUT: db/id
```

### Params: 

* **Object** *mp* Messprog.-Objekt
* **String** *id* KD-id

## rddoc(mp, id)

Die Funktion ```rddoc()```
liefert das Verbindungsobjekt für die
url:
```
GET: db/id
```

### Params: 

* **Object** *mp* Messprog.-Objekt
* **String** *id* KD-id

## docinfo(mp, id)

Die Funktion ```docinfo()```
liefert das Verbindungsobjekt für die
show:
```
_show/docinfo/id
```

### Params: 

* **Object** *mp* Messprog.-Objekt
* **String** *id* KD-id

<!-- End ./lib/net.js -->

