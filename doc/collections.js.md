

<!-- Start ./lib/collections.js -->

## get_frame(mps, req)

Die Funktion ```get_frame()```
stellt
* die MP _id_
* das MP _standard_
* den _name_
* den _container title_ und
* die _container description_
in einem Objekt zusammen.

### Params: 

* **Object** *mps* globales MP Objekt
* **Object** *req* request-Objekt

## get_mps(mps, req)

Die Funktion```get_mps()``` stellt
Informationen über die initialisierten
Messprogramme zusammen.

### Params: 

* **Object** *mps* globales MP Objekt
* **Object** *req* request-Objekt

## get_mp(mps, req)

Die Funktion```get_mp()``` erstellt
ein, der MP-Definition analoges Dokument
welches den aktuellen Zustand des MPs
abbildet.

### Params: 

* **Object** *mps* globales MP Objekt
* **Object** *req* request-Objekt

## get_task_state(mps, req)

Die Funktion```get_task_state()``` erstellt
ein dem Endpunkt ```state/n``` analoges Dokument
welches den aktuellen Zustand des containers ```n```
abbildet und  Informantionen der zugeordneten
Tasks enthält.

### Params: 

* **Object** *mps* globales MP Objekt
* **Object** *req* request-Objekt

## get_container_elements(mps, req)

Die Funktion```get_container_elements()``` bedient
den Endpunkt ```containerelements/n```. Es wird
```element/n``` und ```exchange/``` vereinigt.

### Params: 

* **Object** *mps* globales MP Objekt
* **Object** *req* request-Objekt

<!-- End ./lib/collections.js -->

