/**
 * Eingang:
 * "Lass alle Hoffnung fahren"
 * -- Dante
 */
(function() {
  var name       = "ssmp",
      mps      = {},
      pa         = process.argv,
      port       = pa[2] | 8000,
      defaults   = require("./defaults"),
      gen        = require("./generate").module,
      api        = require("./api"),
      restify    = require("restify"),
      _          = require("underscore"),
      bunyan     = require('bunyan'),
      log        = bunyan.createLogger({name:name}),
      server     = restify.createServer({name:name,
                                         log : log});


  server.pre(restify.pre.sanitizePath());
  server.use(restify.queryParser());
  server.use(restify.bodyParser());

  /**
   *
   * Initialisierung der MP-Instanz
   *
   */
  server.post("/:id/mp", function(req, res, next){
    var id = req.params.id,
        doc  = req.body;

    if(typeof doc === "string"){
      doc=JSON.parse(doc);
      req.log.info(doc, "parsed from string");
    }

    if(mps.hasOwnProperty(id)){
      var msg =  "already initialized",
          ro = {error:msg};

      res.send(ro);
      req.log.error(ro, msg);
    }else{
      mps[id]       = {};
      mps[id].mp    = gen(doc);
      mps[id].id    = gen();
      mps[id].param = gen(defaults.all);

      var msg =  "ini complete",
          ro  = {ok: true}

      res.send(ro);
      req.log.info(ro, msg);
    }
    return next()
  });

  /**
   *
   * get request auf mp
   *
   */
  server.get(/^\/([a-zA-Z0-9_\.\/]*)/,
             function(req, res, next) {
               res.send(api.get(mps,req));
               return next();
             });
  /**
   *
   * --- go!---
   *
   */
  server.listen(port, function() {
    log.info({ok: true}, "server runs on port: " + port);
  });
}).call(this);