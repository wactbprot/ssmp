## http Interface

Nachfolgend eine Übersicht der Wichtigsten von __ssmp__ bereitgestellten API-Endpunkte:


___meta___
* GET: ```http://server:port/mpid/meta``` ... Meta-Informationen des MPs

___state___
* GET: ```http://server:port/mpid/0/state``` ... Abarbeitungszustand des
  ersten Containers 
* GET: ```http://server:port/mpid/0/state/0``` ... Abarbeitungszustand des
  ersten sequentiellen Schritts   
* GET: ```http://server:port/mpid/0/state/0/0``` ... erster paralleler im
  ersten seriellen Schrittes des ersten Containers  

___definition___
* GET/PUT: ```http://server:port/mpid/0/definition``` ... Definition
* GET/PUT: ```http://server:port/mpid/0/definition/0``` ... analog state
* GET/PUT: ```http://server:port/mpid/0/definition/0/0``` ... analog state

___recipe___
* GET/PUT: ```http://server:port/mpid/0/recipe``` ... Rezept
* GET/PUT: ```http://server:port/mpid/0/recipe/0``` ... analog state
* GET/PUT: ```http://server:port/mpid/0/recipe/0/0``` ...analog state

___ctrl___
* GET/PUT: ```http://server:port/mpid/0/ctrl``` ... Kontrollstring des ersten containers

___description___
* GET/PUT: ```http://server:port/mpid/0/description``` ... Beschreibung des 1. Containers 

___title___
* GET/PUT: ```http://server:port/mpid/0/title``` ... Titel des 1. Containers

___id___
* GET: ```http://server:port/mpid/id``` ... angemeldete KD-ids
