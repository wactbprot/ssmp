/**
 * serves infos about thr running system
 */
var info_srv = function(conf, cb) {
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

  server.get( "/css/:file", restify.serveStatic({
    'directory': __dirname
  }));
  server.get( "/fonts/:file", restify.serveStatic({
    'directory': __dirname
  }));
  server.get( "/js/:file", restify.serveStatic({
    'directory': __dirname
  }));
  server.get( "/favicon.ico", restify.serveStatic({
    'directory': __dirname
  }));

  var mem = ndata.createClient({port: conf.mem.port});

/**
 * I's maybe a good idea to provide a
 * human readable page as entrance
 */
  server.get(/^\/def/, function(req, res, next){
    res.writeHead(200, {
      'Content-Type': 'text/html'
    });
    info.defaults(function(html){
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
            , "\n"
            + ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n"
            + "info system up and running @"
            + conf.info.port +"\n"
            + ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n"
            );
    if(_.isFunction(cb)){
      cb();
    }
  });
}
module.exports = info_srv;