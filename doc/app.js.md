

<!-- Start ./app.js -->

Eingang:
"Lass alle Hoffnung fahren"
-- Dante

GET
http://server:port/id/structur/path
Bsp.:
http://localhost:8001/id/param/database

DELETE
http://server:port/id/structur
Bsp.:
http://localhost:8001/id/param

PUT
http://server:port/mpid/cdid

cdid ... calibration doc id
Die ```PUT``` Methode soll auch noch
infos holen; ist in diesem Punkt also
anders als ein normaler put-request

PUT
http://server:port/id/structure/l1/...

PUT
http://server:port/id
- Initialisiert mp-Instanz
- startet observer

POST
http://server:port/id
- nimmt Mp-Definition vom body des
  requests
- Initialisiert mp-Instanz
- startet observer

--- go!---

<!-- End ./app.js -->

