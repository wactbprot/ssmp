/**
 * __Eingang__:
 * ```
 * "Lass alle Hoffnung fahren"
 * ```
 * -- Dante
 *
 * In ```app.js``` wird der http-Server gestartet,
 * welcher die _REST_-Api des _ssmp_ zur Verfügung stellt.
 *
 */
(function() {
  var name    = "http-ssmp"
    , _       = require("underscore")
    , prog    = require("commander")
    , restify = require("restify")
    , bunyan  = require("bunyan")
    , ndata   = require("ndata")
    , coll    = require("./lib/collections")
    , meth    = require("./lib/methods")
    , log     = bunyan.createLogger({name: name})
    , server  = restify.createServer({name: name});

  server.pre(restify.pre.sanitizePath());
  server.use(restify.queryParser());
  server.use(restify.bodyParser());
  server.use(function crossOrigin(req,res,next){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    return next();
  });

  var httpport = 8001,
      memport  = 9000

  var mem     = ndata.createClient({port: memport});

  /**
   * __GET__
   *
   * Alle http-GET Anfragen funktionieren nach dem  Schema:
   * ```
   * http://server:port/id/structur/path
   * ```
   * Mit ```id``` ist die id der Messprogrammdefinition (MPD) gemeint.
   * Es können prinzipiell "beliebig" viele  MPD betrieben werden.
   *
   * Bsp. für GET-Anfrage:
   * ```
   * http://localhost:8001/id/param/database
   * ```
   *
   * @param {String} url url-Muster der Anfrage
   * @param {Function} f Callback
   */
  //// --*-- colection-start --*--
  server.get("/", function(req, res, next){
    coll.get_mps(req, function(o){
      res.send(o);
    });
    next();
  });
  server.get("/:id/:container/taskstate", function(req, res, next){
    coll.get_task_state(req, function(o){
      res.send(o);
    });
    next();
  })
  server.get("/:id/:container/containerelements", function(req, res, next){
    coll.get_container_elements(req, function(o){
      res.send(o);
    });
    next();
  })
  server.get("/:id/:container/containerelements/:key", function(req, res, next){
    coll.get_container_elements(req, function(o){
      res.send(o);
    });
    next();
  })
  // --*-- colection-end --*--

  server.get("/:id/:no", function(req, res, next){
    meth.get(req, function(o){
      res.send(o)
    });
    next();
  })
  server.get("/:id/:no/:struct", function(req, res, next){
    meth.get(req, function(o){
      res.send(o)
    });
    next();
  });
  server.get("/:id/:no/:struct/:l1", function(req, res, next){
    meth.get(req, function(o){
      res.send(o)
    });
    next();
  });
  server.get("/:id/:no/:struct/:l1/:l2", function(req, res, next){
    meth.get(req, function(o){
      res.send(o)
    });
    next();
  });
  server.get("/:id/:no/:struct/:l1/:l2/:l3", function(req, res, next){
    meth.get(req, function(o){
      res.send(o)
    });
    next();
  });

  /**
   * __PUT__
   *
   * Ein http-PUT geht so:
   * ```
   * http://server:port/id/structur/path
   * ```
   * eine Besonderheit ist:
   * ```
   * http://server:port/mpid/cdid
   *```
   * wobei mit ```cdid```` die _calibration doc id_
   * gemeint ist.
   * Der PUT-request soll zusätzliche Infos über das Kalibbrierdokument
   * besorgen. Es ist deshalb eine Datenbankabfrage mit einem solchen PUT
   * verbunden (ist in diesem Punkt also
   * anders als ein normales PUT)
   *
   * @param {String} url url-Muster der Anfrage
   * @param {Function} f Callback
   */
  server.put("/:id/id/:cdid", function(req, res, next) {
    meth.load_cd(req, function(o){
      res.send(o);
    });
    next();
  });
  /*
   * PUT
   * http://server:port/id/structure/l1/...
   */
  server.put("/:id/:no/:struct", function(req, res, next) {
    meth.put(req, function(o){
      res.send(o)
    });
    next();
  });
  server.put("/:id/:no/:struct/:l1", function(req, res, next) {
    meth.put(req, function(o){
      res.send(o)
    });
    next();
  });
  server.put("/:id/:no/:struct/:l1/:l2", function(req, res, next) {
    meth.put(req, function(o){
      res.send(o)
    });
    next();
  });
  server.put("/:id/:no/:struct/:l1/:l2/:l3", function(req, res, next) {
    meth.put(req, function(o){
      res.send(o)
    });
    next();
  });

  /*
   * PUT
   * http://server:port/id
   * - Initialisiert mp-Instanz
   * - startet observer
   */
  server.put("/:id", function(req, res, next){
    meth.load_mp(req, function(o){
      res.send(o);
    });
    next();
  });

  /**
   * __POST__

   * ```
   * http://server:port/id
   * ```
   *
   * Übernimmt MPD vom _body_ des  requests
   * Initialisiert die MP-Instanz und startet
   * die ```observer()```-Funktion
   *
   * @param {String} url url-Muster der Anfrage
   * @param {Function} f Callback
   */
  server.post("/:id", function(req, res, next){
    meth.load_mp(req, function(o){
      res.send(o);
    });
    next();
  });

  //
  // --- go!---
  //
  server.listen(httpport, function() {
    log.info({ok: true}
            , "http-ssmp up and running @" + httpport);

});

}).call(this);