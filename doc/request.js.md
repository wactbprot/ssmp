

<!-- Start ./lib/request.js -->

## request(mp, task, pfad, con, wrtdata, cb)

Generische http request Funktion.
Eine erfolgreiche Antwort (```data```)
wird der Funktion ```receive()``` übergeben.

Fehler werden je nach ```onerror```-Einstellung
des Containers ( = ```_.first(path)```) behandelt.

### Params: 

* **Object** *mp* Messprog.-Objekt
* **Object** *task* Task-Objekt
* **Array** *pfad* Pfad Array
* **Object** *con* Verbindungs-Objekt
* **String** *wrtdata* i.a. json-string
* **Function** *cb* Callback Funktion

<!-- End ./lib/request.js -->

