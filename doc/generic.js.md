

<!-- Start ./lib/generic.js -->

## mod(obj)

```mod``` ist closure die das Objekt
```def``` closed.
Auf dem Objekt werden  ```getter```
und ```setter``` zur Verfügung gestellt,
die benutzt werden können um sichere
Objekte wie```params```, ```ids```,
```mps``` uvm. zu erzeugen. Das
Zugriffsmuster ist dann z.B.

```
  mp.param.get(["system", "heartbeat"], function(mpSystemHeartbeat){

})
```

oder

```
mp.param.set(["system", "heartbeat"], 1000, callback)
```

### Params: 

* **Object** *obj* Inertialobjekt

<!-- End ./lib/generic.js -->

