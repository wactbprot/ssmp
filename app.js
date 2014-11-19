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
  var name    = "ssmp"

    , _       = require("underscore")
    , prog    = require("commander")
    , restify = require("restify")
    , bunyan  = require("bunyan")
    , ndata   = require("ndata")
    , col     = require("./lib/collections")
    , method  = require("./lib/methods")
    , log     = bunyan.createLogger({name: name})
    , server  = restify.createServer({name: name})
    , ok      = {ok:true}

  prog.version("0.2")
  .option("-P, --port <port>", "http port (default is  8001)", parseInt)
  .parse(process.argv);

  var port    = prog.httpport  || 8001;

  server.pre(restify.pre.sanitizePath());
  server.use(restify.queryParser());
  server.use(restify.bodyParser());
  server.use(function crossOrigin(req,res,next){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    return next();
  });

  var mem = ndata.createClient({port: 9000});



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
    col.get_mps(req, function(o){
      res.send(o);
    });
    next();
  });
  //server.get("/:id/taskstate/:container", function(req, res, next){
  //  col.get_task_state(mps, req, function(o){
  //    res.send(o);
  //  });
  //  next();
  //})
  //server.get("/:id/containerelements/:container", function(req, res, next){
  //  col.get_container_elements(mps, req, function(o){
  //    res.send(o);
  //  });
  //  next();
  //})
  //server.get("/:id/containerelements/:container/:key", function(req, res, next){
  //  col.get_container_elements(mps, req, function(o){
  //    res.send(o);
  //  });
  //  next();
  //})
  // --*-- colection-end --*--

  server.get("/:id/:no", function(req, res, next){
    method.get(req, function(o){
      res.send(o)
    });
    next();
  })
  server.get("/:id/:no/:struct", function(req, res, next){
    method.get(req, function(o){
      res.send(o)
    });
    next();
  });
  server.get("/:id/:no/:struct/:l1", function(req, res, next){
    method.get(req, function(o){
      res.send(o)
    });
    next();
  });
  server.get("/:id/:no/:struct/:l1/:l2", function(req, res, next){
    method.get(req, function(o){
      res.send(o)
    });
    next();
  });
  server.get("/:id/:no/:struct/:l1/:l2/:l3", function(req, res, next){
    method.get(req, function(o){
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
    method.load_cd(req, function(o){
      res.send(o);
    });
    next();
  });

  /*
   * PUT
   * http://server:port/id/structure/l1/...
   */
  server.put("/:id/:no/:struct", function(req, res, next) {
    method.put(req, function(o){
      res.send(o)
    });
    next();
  });
  server.put("/:id/:no/:struct/:l1", function(req, res, next) {
    method.put(req, function(o){
      res.send(o)
    });
    next();
  });
  server.put("/:id/:no/:struct/:l1/:l2", function(req, res, next) {
    method.put(req, function(o){
      res.send(o)
    });
    next();
  });
  server.put("/:id/:no/:struct/:l1/:l2/:l3", function(req, res, next) {
    method.put(req, function(o){
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
    method.load_mp(req, function(o){
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
    method.load_mp(req, function(o){
      res.send(o);
    });
    next();
  });

  //
  // --- go!---
  //
  server.listen(port, function() {
    log.info({ok: true}
            , "ssmp up and running @" + port);
    require("./lib/load");
    require("./lib/run");
    require("./lib/build");
    require("./lib/observe");
  });

}).call(this);