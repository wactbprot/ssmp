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
var http_ssmp = function(conf, cb, test) {
  var name    = "ssmp.http"
    , _       = require("underscore")
    , prog    = require("commander")
    , restify = require("restify")
    , bunyan  = require("bunyan")
    , ndata   = require("ndata")
    , meth    = require("./methods")
    , log     = bunyan.createLogger({name: name})
    , server  = restify.createServer({name: name})
    , ok = {ok: true};

  server.pre(restify.pre.sanitizePath());
  server.use(restify.queryParser());
  server.use(restify.bodyParser());
  server.use(function crossOrigin(req,res,next){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    return next();
  });
  var mem = ndata.createClient({port: conf.mem.port});

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
    meth.get(req, function(err, ro){
      if(!err){
        res.send(ro);
      }else{
        log.error(err,
                  "get returns with error");
        res.send(err.message);
      }
    });
    next();
  });

  server.get("/:id/:no", function(req, res, next){
    meth.get(req, function(err, ro){
      if(!err){
        res.send(ro);
      }else{
        log.error(err,
                  "get returns with error");
        res.send(err.message);
      }
    });
    next();
  });

  server.get("/:id/:no/:struct", function(req, res, next){
    meth.get(req, function(err, ro){
      if(!err){
        res.send(ro);
      }else{
        log.error(err,
                  "get returns with error");
        res.send(err.message);
      }

    });
    next();
  });

  server.get("/:id/:no/:struct/:l1", function(req, res, next){
    meth.get(req, function(err, ro){
      if(!err){
        res.send(ro);
      }else{
        log.error(err,
                  "get returns with error");
        res.send(err.message);
      }
    });
    next();
  });

  server.get("/:id/:no/:struct/:l1/:l2", function(req, res, next){
    meth.get(req, function(err, ro){
      if(!err){
        res.send(ro);
      }else{
        log.error(err,
                  "get returns with error");
        res.send(err.message);
      }
    });
    next();
  });

  server.get("/:id/:no/:struct/:l1/:l2/:l3", function(req, res, next){
    meth.get(req, function(err, ro){
      if(!err){
        res.send(ro);
      }else{
        log.error(err,
                  "get returns with error");
        res.send(err.message);
      }
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
    meth.handle_cd(req, function(err, ro){
      if(!err){
        res.send(ro);
      }else{
        log.error(err,
                  "cd handle returns with error");
        res.send(err.message);
      }
    });
    next();
  });

  /**
   * PUT
   * http://server:port/id/structure/l1/...
   */
  server.put("/:id/:no/:struct", function(req, res, next) {
    meth.put(req, function(err, ro){
      if(!err){
        res.send(ro);
      }else{
        log.error(err,
                  "put returns with error");
        res.send(err.message);
      }
    });
    next();
  });

  server.put("/:id/:no/:struct/:l1", function(req, res, next) {
    meth.put(req, function(err, ro){
      if(!err){
        res.send(ro);
      }else{
        log.error(err,
                  "put returns with error");
        res.send(err.message);
      }
    });
    next();
  });

  server.put("/:id/:no/:struct/:l1/:l2", function(req, res, next) {
    meth.put(req, function(err, ro){
      if(!err){
        res.send(ro);
      }else{
        log.error(err,
                  "put returns with error");
        res.send(err.message);
      }
    });
    next();
  });

  server.put("/:id/:no/:struct/:l1/:l2/:l3", function(req, res, next) {
    meth.put(req, function(err, ro){
      if(!err){
        res.send(ro);
      }else{
        log.error(err,
                  "put returns with error");
        res.send(err.message);
      }
    });
    next();
  });

  /**
   * PUT
   * http://server:port/id
   * - Initialisiert mp-Instanz
   * - startet observer
   */
  server.put("/:id", function(req, res, next){
    meth.handle_mp(req, function(err, ro){
      if(!err){
        res.send(ro);
      }else{
        log.error(err,
                  " mp handle returns with error");
        res.send(err.message);
      }
    });
    next();
  });

  //
  // --- go!---
  //
  if(!test){
    server.listen(conf.http.port, function() {
      log.info(ok
              , "\n"
              + "`````````````````````````````\n"
              + "json api up and running @"
              + conf.http.port +"\n"
              + "`````````````````````````````\n"
              );
      if(_.isFunction(cb)){
        cb(null, ok);
      }
    });
  }else{
    if(_.isFunction(cb)){
      cb(null, ok);
    }
  }
}
module.exports = http_ssmp;