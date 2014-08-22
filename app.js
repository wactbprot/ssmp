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
  var name    = "ssmp",
      mps     = {},
      _       = require("underscore"),
      prog    = require("commander"),
      restify = require("restify"),
      bunyan  = require("bunyan"),
      utils   = require("./lib/utils"),
      gen     = require("./lib/generic"),
      obs     = require("./lib/observe"),
      col     = require("./lib/collections"),
      inimp   = require("./lib/ini_mp"),
      inicd   = require("./lib/ini_cd"),
      log     = bunyan.createLogger({name: name}),
      server  = restify.createServer({name: name});

 prog.version("0.0.5")
 .option("-P, --port <port>", "port (default is  8001)", parseInt)
  .parse(process.argv);

  var port = prog.port || 8001;

  server.pre(restify.pre.sanitizePath());
  server.use(restify.queryParser());
  server.use(restify.bodyParser());
  server.use(
    function crossOrigin(req,res,next){
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "X-Requested-With");
      return next();
    }
  );

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
  server.get("/:id", function(req, res, next){
    res.send(col.get_mp(mps, req));
    next();
  });
  server.get("/:id/frame", function(req, res, next){
    res.send(col.get_frame(mps, req));
    next();
  })

  server.get("/:id/:struct", function(req, res, next){
    res.send(utils.get(mps, req));
    next();
  })
  server.get("/:id/:struct/:l1", function(req, res, next){
    res.send(utils.get(mps, req));
    next();
  });
  server.get("/:id/:struct/:l1/:l2", function(req, res, next){
    res.send(utils.get(mps, req));
    next();
  });
  server.get("/:id/:struct/:l1/:l2/:l3", function(req, res, next){
    res.send(utils.get(mps, req));
    next();
  });

  /**
   * __DELETE__
   *
   * Die http-DELETE Anfragen funktionieren nach folgendem Muster:
   * ```
   * http://server:port/id/structur/path
   * ```
   * das löschen ganzer Strukturen ist nicht erlaubt; es muss
   * mind. ein Pfadelement geben
   *
   * Bsp.:
   * ```
   * http://localhost:8001/id/param
   * ```
   * geht nicht
   * ```
   * http://localhost:8001/id/param/database/name
   * ```
   * funktioniert.
   *
   * @param {String} url url-Muster der Anfrage
   * @param {Function} f Callback
   */
  server.del("/:id/:struct/:l1", function(req, res, next){
    utils.del(mps, req, function(rob){
      res.send(rob);
    } );
    next();
  })
  server.del("/:id/:struct/:l1/:l2", function(req, res, next){
    utils.del(mps, req, function(rob){
      res.send(rob);
    } );
    next();
  })
  server.del("/:id/:struct/:l1/:l2/:l3", function(req, res, next){
    utils.del(mps, req, function(rob){
      res.send(rob);
    });
    next();
  })

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
    inicd(mps, req, function(rob){
      res.send(rob);
    });
    next();
  });

  /*
   * PUT
   * http://server:port/id/structure/l1/...
   */
  server.put("/:id/:struct/:l1", function(req, res, next) {
    utils.put(mps, req, function(rob){
      res.send(rob);
    });
    next();
  });
  server.put("/:id/:struct/:l1/:l2", function(req, res, next) {
    utils.put(mps, req, function(rob){
      res.send(rob);
    });
    next();
  });
  server.put("/:id/:struct/:l1/:l2/:l3", function(req, res, next) {
    utils.put(mps, req, function(rob){
      res.send(rob);
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
    var id   = req.params.id;
    inimp(mps, req, function(rob){
      res.send(rob);
      obs(mps[id]);
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
    var id   = req.params.id;
    inimp(mps, req, function(rob){
      res.send(rob);
      obs(mps[id]);
    });
    next();
  });

  //
  // --- go!---
  //
  server.listen(port, function() {
    log.info({ok: true},"ssmp up and running @" + port);
  });

}).call(this);