

<!-- Start ./lib/load.js -->

## load(mp, path)

```load()``` läd die _task_ und sendet die
Replacements (wenn vorhanden) im POST body.

Bevor irgendwas geschieht wird der
```state``` erstmal auf ```working```
gesetzen; alles Weitere geschieht
als callback des ```state```-setters.

```load()``` ist auch
reload; in diesem Fall
ist _task_ ein schon die
eigentliche task
(und keine Ersetzungsvorschrift)

Beginnt der Taskname mit ```CUCO``
(CUCO ... customer calibration object)
wird der String ```CUCO`` noch durch
die etsprechenden Gerätenamen ersetzt.

Wenn mehr als eine Kalib.
geladen ist, muss zu ```state``` und ```recipe```
noch eine Position (am Ende) dazukommen
um die Kunden-Tasks aufzunehmen.

Damit dass nicht zu kompliziert wird
soll nur eine CUCO-Task (read, write ...)
pro seriellem Schritt erlaubt sein.

### Params: 

* **Object** *mp* Messprog.-Objekt
* **Array** *path* Pfad Array

<!-- End ./lib/load.js -->

