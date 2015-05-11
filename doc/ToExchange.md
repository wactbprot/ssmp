## Exchange als Input

Hier ein Beispiel wie man im ```PostProcessing``` Teil einer _task_ das
Schreiben in die Exchange Schnittstelle veranlassen kann:

```javascript
"PostProcessing": [
               "var ok = calculate_ok_from_input,",
               "ToExchange={'key.is.exchange.path':ok};"
           ]
```
Die ```receive()``` Funktion bekommt das unter

```
data.ToExchange
```
und würde hier den wert von ```ok``` in den Pfad ```key.is.exchange.path```
schreiben.

s. [doc/receive.js.md](https://github.com/wactbprot/ssmp/blob/master/doc/receive.js.md)
bzw.
[utils.js.md#write_to_exchange](https://github.com/wactbprot/ssmp/blob/master/doc/utils.js.md#write_to_exchangemp-task-data-cb)
