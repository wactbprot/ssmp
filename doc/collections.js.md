

<!-- Start lib/collections.js -->

## get_mps(req)

Die Funktion```get_mps()``` stellt
Informationen über die initialisierten
Messprogramme zusammen.

### Params:

* **Object** *req* request-Objekt

## get_task_state(req)

Die Funktion```get_task_state()``` erstellt
ein dem Endpunkt ```state/n``` analoges Dokument
welches den aktuellen Zustand des containers ```n```
abbildet und  Informantionen der zugeordneten
Tasks enthält.

### Params:

* **Object** *req* request-Objekt

## get_container_elements(mps, req)

Die Funktion```get_container_elements()``` bedient
den Endpunkt ```containerelements/n```. Es wird
```element/n``` und ```exchange/``` vereinigt.

### Params:

* **Object** *mps* globales MP Objekt
* **Object** *req* request-Objekt

<!-- End lib/collections.js -->

