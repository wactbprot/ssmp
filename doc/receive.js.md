

<!-- Start ./lib/receive.js -->

## exports()

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

Dieser Abschnitt ist für Fälle in denen kein
PostProcessing zur Verfügung steht
aber trotzdem data nach ```Exchange```
geschrieben werden soll

<!-- End ./lib/receive.js -->

