

<!-- Start ./lib/generic.js -->

## _

generische Funktionen
zum Organisieren der codes
wie
- mod erzeugt closure modules
- lift
- walk
- check

## mod()

```mod``` ist closure die das object
```def``` closed.
Auf dem Objekt werden  ```getter```
und ```setter``` zur Verfügung gestellt,
die benutzt werden können um sichere
Objekte wie```params```, ```ids```,
```mps``` uvm. zu erzeugen. Das
Zugriffsmuster ist dann z.B.

```var mpSystemHeartbeat = mp.param.get(["system", "heartbeat"])```

oder

```mp.param.set(["system", "heartbeat"], 1000)```

oder

```mp.ctrl.ini([], "foo")```

## walkstate()

Läuft in sequenzieller Weise
über die ```state``` Struktur
und führt sukzessive die Funktion
```exec``` mit ```mp``` und ```path```
als parameter aus

## checkstate()

Kontrolliert den Zustand des Containers
Nummer ```no``` und fasst diesen in einem
String zusammen

<!-- End ./lib/generic.js -->

