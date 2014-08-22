

<!-- Start ./lib/receive.js -->

## exports(mp, task, pfad, cb)

Die ```receive()``` Function ist die
Standard-Callbackfunktion für Netzwerkaufrufe
wie  ```noderelay()``` oder get List.

Was konkret mit den Daten geschied wird:

1.) anhand der Daten entschieden:
```
if(data.ToExchange) ...
```
Ein Bsp. hierfür wäre der  ```getList()``` worker

oder

2.) anhand der Task entschieden:
```
if(task.ExchangePath) ...
```

```task.ExchangePath``` erledigt die  Fälle
in denen kein  ```PostProcessing`` zur Verfügung steht
aber trotzdem Daten nach ```Exchange```
geschrieben werden sollen.

### Params: 

* **Object** *mp* Messprog.-Objekt
* **Object** *task* Task-Objekt
* **Array** *pfad* Pfad Array
* **Function** *cb* Callback Funktion

<!-- End ./lib/receive.js -->

