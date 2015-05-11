## Ablaufkontrolle

_tasks_ können Schlüsselwörter (keys) besitzen,
die ihre Ausführung beeinflussen; das sind die keys
```RunIf``` und ```StopIf```.

### RunIf

Die "Formulierung" ```RunIf: "got_time.Value"``` bewirkt, dass
die _task_  ausgeführt wird, wenn der Wert unter
dem Pfad _exchange.got___time.Value_ (ausführlich:
http://localhost:8001/mpdef/exchange/got_time/Value)
zu ```true``` ausgewertet wird.
Die _task_:

```javascript
{
    Action      : "wait",
    Comment     : "Ready in  1000 ms",
    TaskName    : "Mp-cond_wait",
    Exchange    : "wait_time.Value",
    Id          : ["kdid-1","kdid-2","kdid-3","kdid-4"],
    CuCo        : false,
    MpName      : "Mp"
    RunIf       : "got_time.Value",
}
```

wird gestartet, nachdem z.B.:

```
$> bin/mp_set -i mpdef -p  exchange/got_time/Value -d 'true'
```
ausgeführt wurde.

### StopIf

```StopIf``` funktioniert ganz analog ```RunIf```: Die _task_ wird nicht
erneut ausgeführt, wenn der Wert unter dem Pfad ```exchange.pfill_ok.Value```
zu ```true``` ausgewertet werden kann.
