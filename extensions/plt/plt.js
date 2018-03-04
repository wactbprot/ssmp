module.exports = function(cb){
  var _       = require("underscore")
    , bunyan  = require("bunyan")
    , restify = require("restify")
    , corsM   = require('restify-cors-middleware')
    , conf    = require("../../lib/conf")
    , broker  = require("sc-broker")
    , server  = restify.createServer({name: conf.plt.appname})
    , log     = bunyan.createLogger({name: conf.plt.appname})
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
 server.get( "/html/:file", restify.plugins.serveStatic({
'directory': __dirname
 }));
 server.get( "/js/:file", restify.plugins.serveStatic({
'directory': __dirname
 }));



  server.listen(conf.plt.port, function() {
    log.info(ok
            , " ----> plot server up and running http://" +conf.plt.server + ":" + conf.plt.port
            );
    if(_.isFunction(cb)){
      cb();
    }
  });
  }
