

<!-- Start lib/net.js -->

## relay()

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

## task()

Die Funktion ```task()```
liefert das Verbindungsobjekt für die
list:
```
POST: _list/listname/viewname
```

## list(task)

Die Funktion ```list()```
liefert das Verbindungsobjekt für die
list:
```
GET: _list/listname/viewname?key=value
```

### Params:

* **Object** *task* aufrufende Task

## wrtdoc(id)

Die Funktion ```wrtdoc()```
liefert das Verbindungsobjekt für die
url:
```
PUT: db/id
```

### Params:

* **String** *id* KD-id

## rddoc(id)

Die Funktion ```rddoc()```
liefert das Verbindungsobjekt für die
url:
```
GET: db/id
```

### Params:

* **String** *id* KD-id

## docinfo(id)

Die Funktion ```docinfo()```
liefert das Verbindungsobjekt für die
show:
```
_show/docinfo/id
```

### Params:

* **String** *id* KD-id

<!-- End lib/net.js -->

