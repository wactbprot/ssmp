

<!-- Start ./lib/request.js -->

## exec(mp, task, pfad, con, wrtdata, cb)

Generische http request Funktion.
Bei erfolgreiche Antwort (```data```)
werden die Daten dem callback ```cb(data)``` übergeben.

Fehler werden je nach ```OnError```-Einstellung
des Containers ( = ```_.first(path)```) behandelt.

### Params: 

* **Object** *mp* Messprog.-Objekt
* **Object** *task* Task-Objekt
* **Array** *pfad* Pfad Array
* **Object** *con* Verbindungs-Objekt
* **String** *wrtdata* i.a. json-string
* **Function** *cb* Callback Funktion

<!-- End ./lib/request.js -->

