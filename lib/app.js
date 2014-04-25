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
    next()
  });

  /**
   * get request auf [mp, id, param, ...]
   */
  server.get(/^\/([a-zA-Z0-9_\.\/]*)/,
             function(req, res, next) {
               api.get(mps, req, function(ro){
                 res.send(ro)
               });
               next();
             });


  /**
   * container load/start/stop
   */
  server.put("/:id/ctrl/:container",
             function(req, res, next) {
               var id        = req.params.id,
                   no        = req.params.container,
                   cmd       = req.body;

               req.params[0] = id + "/ctrl/" + no;
               api.set(mps, req, function(){
                 if(typeof cmd === "string" && cmd === "load"){
                   ctrl.load(mps[id], no, function(ro){
                     res.send(ro)
                   });
                 }

                 if(typeof cmd === "string" && cmd === "run"){
                   console.log("run");
                   //res.send(ctr.run(mps[id], container));
                 }
                 if(typeof cmd === "string" && cmd === "pause"){
                   console.log("pause");
                   //res.send(ctr.run(mps[id], container));
                 }
               });
               next();
             });


  /**
   * set request nach [mp, id, param, ...]
   */
  server.put(/^\/([a-zA-Z0-9_\.\/]*)/,
             function(req, res, next) {
               api.set(mps, req, function(ret){
                 res.send(ret);
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