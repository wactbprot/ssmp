

<!-- Start lib/load.js -->

## name

Erstellt das Rezept aus der Definition

### Params:

* **Object** *mp* Messprog.-Objekt
* **Number** *no* Nummer des Containers (--> was eigentlich zum path zusammengefasste werden sollte

## distribute_def(mp, no, def, cb)

Bearbeitet die expandierte Definition und veranlasst
den Datenbankabruf der einzelnen Tasks

### Params:

* **Object** *mp* Messprog.-Objekt
* **Number** *no* Nummer des Containers
* **Array** *def* expandiertes Definitionsobjekt
* **Function** *cb* callback

## insert(mp, def, calibobjs, cb)

Fügt über Customer erweiterte Definitionen
in Gesamtablauf. Bsp.: Auslese der Kundengeräte.

### Params:

* **Object** *mp* Messprog.-Objekt
* **Array** *def* noch nicht expandiertes Definitionsobjekt
* **Object** *calibobjs* geladene Calibrierungen
* **Function** *cb* callback

<!-- End lib/load.js -->

