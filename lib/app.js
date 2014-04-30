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
   * POST
   * http://server:port/id
   * - Initialisiert mp-Instanz
   * - startet observer
   */
  server.post("/:id", function(req, res, next){

    var id   = req.params.id;

    ctrl.ini(mps, req, function(){

      res.send({result:"initializing complete"});
      mps[id].observer  = setInterval(function(){

                            ctrl.observe(mps[id]);

                          }, mps[id].param.get(["system", "heartbeat"]));
    });
    next();
  });

  /**
   * GET
   * http://server:port/id/structur
   * Bsp.:
   * http://localhost:8001/id/param/database
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
      if(_.isUndefined(obj)){
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
   * GET
   * http://server:port/id/structur
   * Bsp.:
   * http://localhost:8001/id/param
   */
  server.get("/:id/:struct", function(req, res, next){
    var msg, ro,
        id     = req.params.id,
        struct = req.params.struct;

    if(id            &&
       struct        &&
       mps           &&
       mps[id]       &&
       mps[id][struct]){

      var mp  = mps[id],
          obj = mp[struct].get();

      if(_.isUndefined(obj)){
        msg = "found nothing";
        ro  = {error: msg};
        req.log.error(ro, msg);
      }else{
        msg = "obj sent back";
        ro  = {result:obj};
        req.log.info(ro, msg);
      }
    }else{
      msg = "no such structure";
      ro  = {error: msg};
      req.log.error(ro, msg);
    }
    res.send(ro)
    next()
  })

  /**
   * PUT
   * http://server:port/id/structure/path
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

      req.log.info({data:obj}, "try to set");

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