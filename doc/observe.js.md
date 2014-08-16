

<!-- Start ./lib/observe.js -->

## exports()

Die Funktion ```observe``` beobachtet die ```ctrl```
Schnittstelle der ```container```.

Zusätzlich wird der ```state``` (Zustand der
einzelnen Tasks) ausgewertet. Sind alle
```state```s ```executed``` werden alle
auf ```ready``` zurückgesetzt und
der ```ctrl``` String des containers ebenfalls
auf ```ready``` gesetzt.  Reagiert wird auf:

- load
- run
- stop
- pause

todo:

und Komma separierte Aufzählungen wie:
- load,run,stop

<!-- End ./lib/observe.js -->

