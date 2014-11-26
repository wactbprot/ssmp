## socket.io Interface

Nachfolgend eine Beschreibung der Wichtigsten von __ssmp__ bereitgestellten
[socket.io](http://socket.io/) Schnittstellen. Zunächst die vom Server
veröffentlichten Daten. 

### server push

___state___

Publiziert bei einer Änderung ein Objekt der Art:
```
{
   path:[id, no, "state"],
   data: {... state ...}
}
```

Hierbei und im folgenden ist ```id``` die id des Messprogrammdokuments und
```no``` die (von 0 an gezählte) Nummer des Containers.


___recipe___

Publiziert bei einer Änderung ein Objekt der Art:

```
{
   path:[id, no, "recipe"],
   data: {... recipe ...}
}
```

___exchange___


Publiziert bei einer Änderung ein Objekt der Art:
```
{
   path:[id, "exchange"],
   data: {... exchange ...}
}
```

__load_cd__

Ändert sich die Anzahl der  KD wird ein Objekt der
Art: 
```
{
   path:[id, "id"],
   data: {... docinfos ...}
}
```
veröffentlicht.

### Client requests

Auf folgende _events_ reagiert der Server zunächst mit einem ```{ok:true}```
oder ```{error: error message}```. Im Laufe der Abarbeitung des _requests_
können verschiedene Server push Aktionen getriggert werden.

__load_mp__

Wird zum Laden eines MP verwendet. Benötigt:
```
{
   id: id, (Bsp.: "mp-waittest")
   cmd: cmd (Bsp.:"load")
}
```
es kann auch bereits das MP-Dokument gesandt werden:
```
   {_id: ...
	Mp: ...
         ...
}
```
__load_cd__

Wird zum Laden eines KD verwendet. Benötigt:
```
{
   id: id, (Bsp.: "mp-waittest")
   cdid: cdid, (Bsp.: "ca-test_doc_1")
   cmd: cmd, (Bsp.:"load")
}
```
__ctrl__

Die Container werden über folgendes Objekt gesteuert:
```
{
   id: id,  (Bsp.: "mp-waittest")
   no: no,  (Bsp.: 0, 1. Container)
   cmd: cmd (Bsp.: "load;run")
}
```


__meta__

Kann zum Aufbau einer Grundstruktur dienen. Benötigt die:
```
{
   id: id (Bsp.: "mp-waittest")
}
```

Gibt kein ```{ok:true}``` o.ä. zurück sondern antwortet mit der angeforderten
Datenstruktur:  

```
{
   path:[id, "meta"],
   data: {... meta ...}
}
```

