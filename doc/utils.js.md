

<!-- Start lib/utils.js -->

## cmd_to_array(cmdstr)

Die ```cmd_to_array()``` Funktion zerlegt die
unter ```Mp.Container[i].Ctrl``` bzw. ```http://.../mpid/ctrl```
angebbaren Steuerzeichen (_cmdstr_) und erzeugt daraus eien Array,
dessen erstes Feld den aktuellen Auftrag (load, run etc.)
beinhaltet; die Funktion ```observe()``` benutzt dieses erste Feld,
um entsprechende Funktionen auszuwählen.

Wenn der _cmdstr_ so aussieht:
```
"load;run;stop"
```
soll:
```
["load","run", "stop"]
```
erzeugt werden. Sieht der _cmdstr_wie folgt aus:
```
"load;2:run,stop"
```
soll:
```
["load","run", "stop","run", "stop"]
```
erzeugt werden. Steht an lezter Stelle der String ```mon```
wird immer wieder ```["mon"]``` zurückgeliefert.

### Params:

* **String** *cmdstr* Steuerstring

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
* **String** *pfad* punktseparierter Pfadstring
* **Array** *dataset* Array mit Datenobjekten
* **Function** *cb* Callback Funktion

## query_cd(mp, task, path, data, cb)

Die Funktion ```query_cd()``` holt
ein Kalibrierdokument (aka KD
oder cd: calibration document) von der Datenbank
ruft die Funktion ```data_to_doc()``` auf und
übergibt dieser Funktion als callback den Auftrag
zum wieder Abspeichern des nun aufgefüllten cd.

### Params:

* **Object** *mp* Messprog.-Objekt
* **Object** *task* Task-Objekt
* **Array** *path* state-Pfad
* **Object** *data* Objekt mit Result key
* **Function** *cb* Callback Funktion

## write_to_exchange(mp, task, data, cb)

Die Funktion ```write_to_exchange()``` schreibt
übergebene Daten in die ```/exchange/pfad/zu/daten``` Schnittstelle.
Es gibt zwei Möglichkeiten wie der Pfad
```.../pfad/zu/daten``` angegeben werden kann:

1)  _key_ des ```data.ToExchange.pfad.zu.daten```
Bsp. (PostProcessing- Teil einer _task_):
```
...
 "PostProcessing": [
             "var _vec=_x.map(_.extractSRG3),",
              ...
             "ToExchange={'MKS-SRG-3-Ctrl-1-pressure.Type.value':'@token',
                          'MKS-SRG-3-Ctrl-1-pressure.Value.value':_res.mv,
                          'MKS-SRG-3-Ctrl-1-pressure.Unit.value':'mbar' };"
         ]
```
Das hier angegeben ```PostProcessing``` liefert das ```data```
Objekt; ```pfad.zu.daten``` wäre hier z.B. ```MKS-SRG-3-Ctrl-1-pressure.Value.value```

2) der Pfad wird einfach mit dem key ```Task.ExchangePath``` vorher
in der _task_ angegeben; alle Daten die von der _task_
geliefert werden, werden dann an diese Stelle geschrieben.
Bsp. (vollst. _task_):
```
   {
           "Action": "getList",
           "Comment": "Remove an Element from Elements and Exchange",
           "TaskName": "get_calib_select",
           "ViewName": "calibrations",
           "ListName": "select",
           "Params": {
               "key": "@standard-@year"
           },
           "ExchangePath": "Documents"
       }
```
Die Daten die die DB-Abfrage liefert sind (von der _list_-Funktion
so  aufbereitet, dass sie als Gesamtheit nach ```/exchange```
geschrieben werden können.

Gibt es unter dem Pfad ```Task.ExchangePath``` schon eine Struktur,
wird diese um die Übergebne erweitert.

### Params:

* **Object** *mp* Messprog.-Objekt
* **Object** *task* Task-Objekt
* **Object** *data* zu schreibende Daten
* **Function** *cb* Callback Funktion

## cp(no, template, val, cb)

Die Funktion kopiert die Struktur ```template```
und erzeugt eine genauso strukturiertes
Objekt unter ```path``` und initialisiert
es mit ```val```

### Params:

* **Number** *no* Container
* **Array** *template* Strukturvorlage
* **String** *val* Inertialer Wert
* **Function** *cb* callback Funktion

<!-- End lib/utils.js -->

