

<!-- Start lib/methods.js -->

## load_mp(req, cb)

Die Funktion ```ini_mp()``` initialisiert eine
MP-Instanz.

Wird ein Objekt im request body übergeben, wird
dieses benutzt. Wird der String ```load``` gesandt,
wird versucht das Dokument von der Datenbank zu
beziehen.

### Params:

* **Object** *req* Request-Objekt
* **Function** *cb* call back

## load_cd()

```cdid``` speichert nicht nur
die id der Kalibrierdokumente
sondern besorgt auch noch einige
Infodaten über die entsprechnende
Kalibrierung, welche dann unter
dem key id aufbewahrt werden bzw.
abgefragt werden können

<!-- End lib/methods.js -->

