

<!-- Start ./lib/walk.js -->

## struct(mp, no, struct, exec)

Läuft in sequenzieller Weise
über die ```state``` Struktur
und führt sukzessive die Funktion
```exec``` mit ```mp``` und ```path```
als Parameter aus

### Params: 

* **Object** *mp* Messprog.-Objekt
* **Number** *no* Container
* **Array** *struct* Struktur über die iteriert werden soll
* **Function** *exec* Aufruf

## checkstate(mp, no)

Kontrolliert den Zustand des Containers
Nummer ```no``` und fasst diesen in einem
String zusammen.

### Params: 

* **Object** *mp* Messprog.-Objekt
* **Number** *no* Container

## setstate(mp, no, struct, val, cb)

Die Funktion kopiert die Struktur ```struct```
Sie erzeugt eine genauso strukturiertes
```mp.state.[g|s]et```-Objekt und initialisiert
es mit ```val```

### Params: 

* **Object** *mp* Messprog.-Objekt
* **Number** *no* Container
* **Array** *struct* Strukturvorlage
* **String** *val* Inertialer Wert
* **Function** *cb* callback Funktion

<!-- End ./lib/walk.js -->

