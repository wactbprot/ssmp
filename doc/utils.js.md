

<!-- Start ./lib/utils.js -->

## cmd_to_array()

wenn der cmdstr kann so aussieht:
"load;run;stop"
soll das rauskommen:
["load","run", "stop"]
wenn der cmdstr kann so aussieht:
"load;2:run,stop"
soll das rauskommen:
["load","run", "stop","run", "stop"]

## data_to_doc(doc, pfad, dataset, cb)

Die Function ```data_to_doc()```
schreibt Daten in Dokumente und ruft den callback
(in aller Regel ```save(doc)```)
mit dem so aufgefüllten Dokument auf.

Ein Beispiel für ein gültiges dataset ist:
```
[
  {
   Type:"a",         |
   Unit:"b",         | Datenobjekten 0
   Value:1,          |
   Comment:"bla"     |
  },
  {
   Type:"c",         |
   Unit:"d",         | Datenobjekten 1
   Value:2,          |
   Comment:"blu"     |
  }
]
```

### Params: 

* **Object** *doc* Dokument (Kalibrierdokument)
* **Array** *pfad* Pfad Array
* **Array** *dataset* Array mit Datenobjekten
* **Function** *cb* Callback Funktion

## query_cd(mp, task, data, cb)

Die Funktion ```query_cd()``` holt
ein Kalibrierdokument (aka KD
oder cd: calibration document) von der Datenbank
ruft die Funktion ```data_to_doc()``` auf und
übergibt dieser Funktion als callback den Auftrag
zum wieder Abspeichern des nun aufgefüllten cd.

### Params: 

* **Object** *mp* Messprog.-Objekt
* **Object** *task* Task-Objekt
* **Object** *data* Objekt mit Result key
* **Function** *cb* Callback Funktion

<!-- End ./lib/utils.js -->

