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
      ctrl    = require("./ctrl");

  var log     = bunyan.createLogger({name: name}),
      server  = restify.createServer({name: name,
                                      log: log});

  prog.version("0.0.1")
  .option("-p, --port <port>", "port (default is  8001)", parseInt)
  .parse(process.argv);

  var port = prog.port || 8001;

  server.pre(restify.pre.sanitizePath());
  server.use(restify.queryParser());
  server.use(restify.bodyParser());

  /**
   * initialisiert mp-Instanz
   */
  server.post("/:id", function(req, res, next){
    var id   = req.params.id;
    ctrl.ini(mps, req, function(ret){
      res.send(ret);
    })
    next()
  });


  /**
   * --*-- get --*--
   *
   * GET
   * http://server:port/id/structur/path
   *
   *
   * ```id``` ist die ```id``` des Messprogrammdokuments
   * bzw. der Messprogrammdefinition
   *
   * Bsp.:
   *
   * http://localhost:8001/id/param/database
   *
   */
  server.get("/:id/:struct/:path", function(req, res, next){
    var msg, ro,
        id     = req.params.id,
        struct = req.params.struct,
        path   = req.params.path.split("/");

    if(id            &&
       struct        &&
       mps           &&
       mps[id]       &&
       mps[id][struct]){

      var mp  = mps[id],
          obj = mp[struct].get(path);

      if(typeof obj === undefined){
        msg = "found nothing";
        ro  = {error: msg};
        req.log.error(ro, msg);
      }else{
        msg = "obj sent back";
        ro  = {result:obj};
        req.log.info(ro, msg);
      }
    }else{
      msg = "nothing in the path ";
      ro  = {error: msg};
      req.log.error(ro, msg);
    }
    res.send(ro)
    next()
  })
  /**
   * --*-- set --*--
   *
   * PUT
   * http://server:port/id/structure/path
   *
   * ```id``` ist die ```id``` des Messprogrammdokuments
   * bzw. der Messprogrammdefinition
   * Bsp.:
   *
   *
   *
   */
  server.put("/:id/:struct/:path", function(req, res, next) {
    var msg, ro,
        id     = req.params.id,
        struct = req.params.struct,
        path   = req.params.path.split("/"),
        obj    = req.body;

    if(id            &&
       struct        &&
       mps           &&
       mps[id]       &&
       mps[id][struct]){

      mps[id][struct].set(path, obj, function(){
        res.send({ok:true});
      });
    }else{
      res.send({ok:false});
      req.log.error(req, "not a valid path");
    }
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