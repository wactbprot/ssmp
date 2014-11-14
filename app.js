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
    , mps     = {}
    , _       = require("underscore")
    , prog    = require("commander")
    , restify = require("restify")
    , bunyan  = require("bunyan")
    , ndata   = require("ndata")
    , utils   = require("./lib/utils")
    , gen     = require("./lib/generic")
    , col     = require("./lib/collections")
    , inimp   = require("./lib/ini_mp")
    , inicd   = require("./lib/ini_cd")
    , observe = require("./lib/observe")
    , log     = bunyan.createLogger({name: name})
    , server  = restify.createServer({name: name})

    , ok = {ok:true}

  prog.version("0.2")
  .option("-P, --port <port>", "http port (default is  8001)", parseInt)
  .parse(process.argv);



  var port    = prog.httpport  || 8001;

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

  var mem = ndata.createClient({port: 9000})
  var put = function(req, res){
    var ro
      , ok       = {ok:true}
      , path     = utils.get_path(req)
      , strpath  = path.join(" ")

    mem.set(path, req.body, function(err){
      if(!err){
        res.send(ok);
        log.info(ok
                , "set value to path: " + strpath);

      }else{
        ro = {error:err}
        res.send(ro);
        log.error(ro
                 , "set value to path: " + strpath);
      }
    });
  }

  var get = function(req, res){
    var ro
      , ok = {ok:true}
      , path = utils.get_path(req);
    log.info(ok
            , "receice get request to path " + path.join(" "));
    mem.get(path, function(err, obj){
      if(err){
        ro = {error:err}
        log.error(ro
                 ,"error on get from mem");
      }else{
        if(_.isUndefined(obj)){
          ro = {error:"object is undefined"}
          log.error(ro
                   ,"found nothing in the path");
        }else{
          if(_.isObject(obj) || _.isArray(obj)){
            ro = obj;
            log.info(ok
                    , "sent object back");
          }else{
            ro  = {result:obj}
            log.info(ok
                    , "sent value back");
          };
        }
      }
      res.send(ro)
    })
  }



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
  //server.get("/", function(req, res, next){
  //  col.get_mps(mps, req, function(o){
  //    res.send(o);
  //  });
  //  next();
  //});
  //server.get("/:id", function(req, res, next){
  //  col.get_mp(mps, req, function(o){
  //    res.send(o);
  //  });
  //  next();
  //});
  //server.get("/:id/frame", function(req, res, next){
  //  col.get_frame(mps, req, function(o){
  //    res.send(o);
  //  });
  //  next();
  //})
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
    get(req, res);
    next();
  })
  server.get("/:id/:no/:struct", function(req, res, next){
    get(req, res);
    next();
  });
  server.get("/:id/:no/:struct/:l1", function(req, res, next){
    get(req, res);
    next();
  });
  server.get("/:id/:no/:struct/:l1/:l2", function(req, res, next){
    get(req, res);
    next();
  });
  server.get("/:id/:no/:struct/:l1/:l2/:l3", function(req, res, next){
    get(req, res);
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
    inicd(mps, req, function(rob){
      res.send(rob);
    });
    next();
  });

  /*
   * PUT
   * http://server:port/id/structure/l1/...
   */
  server.put("/:id/:no/:struct", function(req, res, next) {
    put(req, res);
    next();
  });
  server.put("/:id/:no/:struct/:l1", function(req, res, next) {
    put(req, res);
    next();
  });
  server.put("/:id/:no/:struct/:l1/:l2", function(req, res, next) {
    put(req, res);
    next();
  });
  server.put("/:id/:no/:struct/:l1/:l2/:l3", function(req, res, next) {
    put(req, res);
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
    inimp(mps, req, function(o){
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
    var id   = req.params.id;
    inimp(mps, req, function(o){
      res.send(o);
    });
    next();
  });

  //
  // --- go!---
  //
  server.listen(port, function() {
    log.info({ok: true},"ssmp up and running @" + port);
    require("./lib/load");
    require("./lib/allexecuted");
  });

}).call(this);