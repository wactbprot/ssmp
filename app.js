/**
 * Eingang:
 * "Lass alle Hoffnung fahren"
 * -- Dante
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
      ini     = require("./lib/ini"),
      log     = bunyan.createLogger({name: name}),
      server  = restify.createServer({name: name,
                                      log: log});

  prog.version("0.0.3")
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
   * GET
   * http://server:port/id/structur/path
   * Bsp.:
   * http://localhost:8001/id/param/database
   */
  server.get("/:id", function(req, res, next){
    res.send(utils.get(mps, req));
    next();
  });
  server.get("/:id/frame", function(req, res, next){
    res.send(utils.get_frame(mps, req));
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
   * DELETE
   * http://server:port/id/structur
   * Bsp.:
   * http://localhost:8001/id/param
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
   * PUT
   * http://server:port/mpid/cdid
   *
   * cdid ... calibration doc id
   * Die ```PUT``` Methode soll auch noch
   * infos holen; ist in diesem Punkt also
   * anders als ein normaler put-request
   */
  server.put("/:id/id/:cdid", function(req, res, next) {
    utils.get_cd_info(mps, req, function(rob){
      res.send(rob);
    });
    next();
  });

  /**
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

  /**
   * PUT
   * http://server:port/id
   * - Initialisiert mp-Instanz
   * - startet observer
   */
  server.put("/:id", function(req, res, next){
    var id   = req.params.id;
    ini(mps, req, function(rob){
      res.send(rob);
      obs(mps[id]);
    });
    next();
  });

  /**
   * POST
   * http://server:port/id
   * - nimmt Mp-Definition vom body des
   *   requests
   * - Initialisiert mp-Instanz
   * - startet observer
   */
  server.post("/:id", function(req, res, next){
    var id   = req.params.id;
    ini(mps, req, function(rob){
      res.send(rob);
      obs(mps[id]);
    });
    next();
  });

  /**
   * --- go!---
   */
  server.listen(port, function() {
    log.info({ok: true},
             "server runs on port: " + port);
  });

}).call(this);