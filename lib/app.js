/**
 * Eingang:
 * "Lass alle Hoffnung fahren"
 * -- Dante
 */
(function() {
  var name       = "ssmp",
      mps        = {},
      pa         = process.argv,
      port       = pa[2] | 8000,
      api        = require("./api"),
      ctrl       = require("./ctrl"),
      restify    = require("restify"),
      _          = require("underscore"),
      bunyan     = require('bunyan'),
      log        = bunyan.createLogger({name: name}),
      server     = restify.createServer({name: name,
                                         log: log});


  server.pre(restify.pre.sanitizePath());
  server.use(restify.queryParser());
  server.use(restify.bodyParser());

  /**
   * initialisiert mp-Instanz
   */
  server.post("/:id/mp", function(req, res, next){
    var id   = req.params.id;
    api.ini(mps, req, function(ret){
      res.send(ret);
    })
    return next()
  });

  /**
   * get request auf [mp, id, param, ...]
   */
  server.get(/^\/([a-zA-Z0-9_\.\/]*)/,
             function(req, res, next) {
               api.get(mps, req, function(ret){
                 res.send(ret);
               });
               return next();
             });


  /**
   * container start/stop
   */
  server.put("/:id/go/:container",
             function(req, res, next) {
               var id        = req.params.id,
                   no        = req.params.container,
                   go        = JSON.parse(req.body);

               req.params[0] = id + "/go/" + no;
               api.set(mps, req, function(ret){
                 res.send(ret);
               });

               if(typeof go === "boolean" &&
                  go){
                 console.log("goooooooooooo");
                 //res.send(ctr.run(mps[id], container));
               }else{
                 console.log("stoooooooooop");
                 //res.send(ctr.stop(mps[id], container));
               }
               return next();
             });

  /**
   * set request nach [mp, id, param, ...]
   */
  server.put(/^\/([a-zA-Z0-9_\.\/]*)/,
             function(req, res, next) {
               api.set(mps, req, function(ret){
                 res.send(ret);
               });
               return next();
             });

  /**
   * --- go!---
   */
  server.listen(port, function() {
    log.info({ok: true},
             "server runs on port: " + port);
  });
}).call(this);