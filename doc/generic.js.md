

<!-- Start ./lib/generic.js -->

## mod(obj)

```mod``` ist closure die das Objekt
```def``` closed.
Auf dem Objekt werden  ```getter```
und ```setter``` zur Verfügung gestellt,
die benutzt werden können um sichere
Objekte wie```params```, ```ids```,
```mps``` uvm. zu erzeugen. Das
Zugriffsmuster ist dann z.B.

```
var mpSystemHeartbeat = mp.param.get(["system", "heartbeat"])
```

oder

```
mp.param.set(["system", "heartbeat"], 1000)
```

oder

```
mp.ctrl.ini([], "foo")
```

### Params: 

* **Object** *obj* Inertialobjekt

## walkstate(mp, no, exec)

Läuft in sequenzieller Weise
über die ```state``` Struktur
und führt sukzessive die Funktion
```exec``` mit ```mp``` und ```path```
als Parameter aus

### Params: 

* **Object** *mp* Messprog.-Objekt
* **Number** *no* Container
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

<!-- End ./lib/generic.js -->

