/**
 * Eingang:
 * "Lass alle Hoffnung fahren"
 * -- Dante
 */
(function() {
  var name    = "ssmp",
      mps     = {},
      _       = require("underscore"),
      prog    = require('commander'),
      restify = require("restify"),
      bunyan  = require('bunyan'),
      utils    = require("./utils"),
      state    = require("./state"),
      ctrl    = require("./ctrl");

  var log     = bunyan.createLogger({name: name}),
      server  = restify.createServer({name: name,
                                      log: log});

  prog.version("0.0.1")
  .option("-P, --port <port>", "port (default is  8001)", parseInt)
  .parse(process.argv);

  var port = prog.port || 8001;

  server.pre(restify.pre.sanitizePath());
  server.use(restify.queryParser());
  server.use(restify.bodyParser());

  /**
   * POST
   * http://server:port/id
   * - Initialisiert mp-Instanz
   * - startet observer
   */
  server.post("/:id", function(req, res, next){
    var id   = req.params.id;
    ctrl.ini(mps, req, function(rob){
      res.send(rob);
      state.observe(mps[id]);
    });
    next();
  });

  /**
   * GET
   * http://server:port/id/structur/path
   * Bsp.:
   * http://localhost:8001/id/param/database
   */
  server.get("/:id/:struct/:path", function(req, res, next){
    res.send(utils.get(mps, req));
    next();
  });

  /**
   * GET
   * http://server:port/id/structur
   * Bsp.:
   * http://localhost:8001/id/param/database
   */
  server.get("/:id/:struct", function(req, res, next){
    res.send(utils.get(mps, req));
    next();
  })

  /**
   * PUT
   * http://server:port/id/structure/path
   */
  server.put("/:id/:struct/:path", function(req, res, next) {
    utils.put(mps, req, function(rob){
      res.send(rob);
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