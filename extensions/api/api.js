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
module.exports = function(cb) {
  var name    = "api"
    , _       = require("underscore")
    , restify = require("restify")
    , corsM    = require('restify-cors-middleware')
    , bunyan  = require("bunyan")
    , broker  = require("sc-broker")
    , conf    = require("../../lib/conf")
    , meth    = require("./methods")
    , ok      = {ok: true}
    , log     = bunyan.createLogger({name: name,
                                     streams: conf.log.streams
                                    })

    , mem     = broker.createClient({port: conf.mem.port
				    })

    var server  = restify.createServer({name: name})


  server.pre(restify.pre.sanitizePath());
  server.use(restify.plugins.queryParser({
    mapParams: true
  }));
  server.use(restify.plugins.bodyParser({
    mapParams: true
  }));
  const cors = corsM({
      preflightMaxAge: 5, //Optional
      origins: ['*'],
      allowHeaders: ['*'],
      exposeHeaders: ['*']
  })

server.pre(cors.preflight)
server.use(cors.actual)

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
  server.get("/", function(req, res, next){
    meth.home(req, function(err, ro){
      if(!err){
        res.send(ro);
      }else{
        log.trace(err,
                  "get returns with error");
        res.send(err.message);
      }
    });
    next();
  });

  server.get("/dump", function(req, res, next){
    meth.dump(req, function(err, ro){
      if(!err){
        res.send(ro);
      }else{
        log.trace(err,
                  "get returns with error");
        res.send(err.message);
      }
    });
    next();
  });

  server.get("/:id", function(req, res, next){
    meth.get(req, function(err, ro){
      if(!err){
        res.send(ro);
      }else{
        log.trace(err,
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
        log.trace(err,
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
        log.trace(err,
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
        log.trace(err,
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
        log.trace(err,
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
        log.trace(err,
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
        log.trace(err,
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
  server.put("/dump", function(req, res, next) {
  meth.restore(req, function(err, ro){
      if(!err){
        res.send(ro);
        log.trace(ok,
                  "restored");
      }else{
        log.trace(err,
                  "put returns with error");
        res.send(err.message);
      }
    });
    next();
  });

  server.put("/:id/:no/:struct", function(req, res, next) {
      meth.put(req, function(err, ro){
      if(!err){
        res.send(ro);
      }else{
        log.trace(err,
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
        log.trace(err,
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
        log.trace(err,
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
        log.trace(err,
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
        log.trace(err,
                  " mp handle returns with error");
        res.send(err.message);
      }
    });
    next();
  });

  server.listen(conf.http.port, function() {
    log.info(ok,
             " ----> json api up and running http://localhost:" + conf.http.port
            );
    if(_.isFunction(cb)){
      log.info(ok
                , "try to exec call back");
      cb();
    }
  });
}
