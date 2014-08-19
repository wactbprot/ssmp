

<!-- Start ./lib/net.js -->

## dbcon()

Die connection  sollte immer frisch sein,
da evtl. während der Messung der db-server
gewechselt werden muss. V.a. für Testzwecke
soll das Ganze aber auch ohne ```mp```
funktionieren.

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

