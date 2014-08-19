

<!-- Start ./lib/net.js -->

## dbcon(mp)

Funktion liefert eine Datenbankverbindungsfunktion (dezeit nano).

Diese Verbindung  sollte immer frisch sein,
da evtl. während der Messung der Datenbankserver
gewechselt werden muss. V.a. für Testzwecke
soll das Ganze aber auch ohne ```mp```
funktionieren.

### Params: 

* **Object** *mp* Messprog.-Objekt

## relay(mp)

Funktion liefert das Options-Objekt,
das für Verbindungen mit dem  _node-relay_-server
benutzt wir.

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

* **Object** *mp* Messprog.-Objekt

<!-- End ./lib/net.js -->

