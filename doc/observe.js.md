

<!-- Start ./lib/observe.js -->

## observe(mp)

Die Funktion ```observe()``` beobachtet periodisch
die ```/ctrl``` Schnittstelle aller _Container_ des
Messprogramms  und deren ```/state``` (Zustand der einzelnen Tasks).

Für den Fall, dass alle
```state```s eines _Containers_  den Wert ```executed```
besitzen, wird deren Wert auf  ```ready``` zurückgesetzt.

Der _Container gilt dann als abgearbeitet.
der ```/ctrl``` String des _Containers_ wird dann
ebenfalls auf den Wert ```ready``` gesetzt.

Die Funktion wird durch den
Messprogramminitialisierungsprozess gestartet.

Die ```observe()``` reagiert auf:

- load
- run
- stop
- pause

### Params: 

* **Object** *mp* Messprog.-Objekt

<!-- End ./lib/observe.js -->

