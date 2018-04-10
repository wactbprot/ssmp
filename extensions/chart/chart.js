module.exports = function(cb){
  var _       = require("underscore")
    , bunyan  = require("bunyan")
    , restify = require("restify")
    , corsM   = require('restify-cors-middleware')
    , broker  = require("sc-broker")
    , conf    = require("../../lib/conf")
    , meth    = require("./lib/methods")
    , server  = restify.createServer({name: conf.chart.appname})
    , log     = bunyan.createLogger({name: conf.chart.appname})
    , mem     = broker.createClient({port: conf.mem.port})
    , ok      = {ok:true}
    , err;

  server.pre(restify.pre.sanitizePath());
  server.use(restify.plugins.queryParser({
    mapParams: true
  }));
  server.use(restify.plugins.bodyParser({
    mapParams: true
  }));

  const cors = corsM({
      preflightMaxAge: 5, //Optional
      origins: ['*'],
      allowHeaders: ['API-Token'],
      exposeHeaders: ['API-Token-Expiry']
  })

server.pre(cors.preflight)
server.use(cors.actual)

 server.get( "/css/:file", restify.plugins.serveStatic({
'directory': __dirname
 }));
 server.get( "/:file", restify.plugins.serveStatic({
'directory': __dirname
 }));
 server.get( "/js/:file", restify.plugins.serveStatic({
'directory': __dirname
 }));

 server.get("/res/info", function(req, res, next){
   log.trace(ok
   , "request to res/info")
    meth.available(req, function(err, ro){
      if(!err){
        res.send(ro);
      }else{
        log.trace(err,
                  "get returns with error");
        res.send(err.message);
      }
    });
    next();
  });

server.get("/:mpid/exchange/:obs/Value", function(req, res, next){
    meth.data(req, function(err, ro){
      if(!err){
        res.send(ro);
      }else{
        log.trace(err,
                  "get returns with error");
        res.send(err.message);
      }
    });
    next();
  });

  server.listen(conf.chart.port, function() {
    log.info(ok
            , " ----> chart server up and running http://" +conf.chart.server + ":" + conf.chart.port
            );
    if(_.isFunction(cb)){
      cb();
    }
  });
  }
