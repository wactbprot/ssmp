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
var http_ssmp = function(conf, cb) {
  var name    = "info"
    , _       = require("underscore")
    , prog    = require("commander")
    , restify = require("restify")
    , bunyan  = require("bunyan")
    , ndata   = require("ndata")
    , info    = require("./info")
    , log     = bunyan.createLogger({name: name})
    , server  = restify.createServer({name: name});

  server.pre(restify.pre.sanitizePath());
  server.use(restify.queryParser());
  server.use(restify.bodyParser());
  server.use(function crossOrigin(req,res,next){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    return next();
  });

  server.get( "/favicon.ico", restify.serveStatic({
    'directory': __dirname
  }));

  var mem = ndata.createClient({port: conf.mem.port});

/**
 * I's maybe a good idea to provide a
 * human readable page as entrance
 */
  server.get("/info", function(req, res, next){
    res.writeHead(200, {
      'Content-Type': 'text/html'
    });
    info(req, function(html){
      res.write(html);
      res.end();

    });
    next();
  });

  //
  // --- go!---
  //
  server.listen(conf.info.port, function() {
    log.info({ok: true}
            , "``````````````````````````````\n"
            + "info system up and running @"
            + conf.info.port +"\n"
            + "``````````````````````````````"
            );
    if(_.isFunction(cb)){
      cb();
    }
  });
}
