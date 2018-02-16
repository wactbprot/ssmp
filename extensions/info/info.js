/**
 * serves infos about the system runtime
 */
module.exports = function(cb) {
  var name     = "info"
    , _        = require("underscore")
    , restify  = require("restify")
    , bunyan   = require("bunyan")
    , broker   = require("sc-broker")
    , get      = require("./get")
    , conf     = require("../../lib/conf")
    , log      = bunyan.createLogger({name:  name,
                                      streams: conf.log.streams
                                     })
    , mem      = broker.createClient({port: conf.mem.port})
    , server   = restify.createServer({name: name})
    , ok       = {ok: true}
    , ctype    = {'Content-Type': 'text/html'};


  var io = require('socket.io')({pingInterval: conf.io.intervall,
                                 pingTimeout: conf.io.timeout})


  server.pre(restify.pre.sanitizePath());
  server.use(restify.plugins.queryParser({
      mapParams: true
  }));
  server.use(restify.plugins.bodyParser({
      mapParams: true
  }));



  server.use(function crossOrigin(req,res,next){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    return next();
  });

  server.get( "/css/:file", restify.plugins.serveStatic({
    'directory': __dirname
  }));
  server.get( "/fonts/:file", restify.plugins.serveStatic({
    'directory': __dirname
  }));
  server.get( "/js/:file", restify.plugins.serveStatic({
    'directory': __dirname
  }));
  server.get( "/favicon.ico", restify.plugins.serveStatic({
    'directory': __dirname
  }));

  server.get(/^\/dev/, function(req, res, next){
    res.writeHead(200, ctype);
    get.devel(function(html){
      res.write(html);
      res.end();
    });
    next();
  });

  // everything else
  server.get(/^[\/]?/, function(req, res, next){
    res.writeHead(200, ctype);
    get.index(function(html){
      res.write(html);
      res.end();
    });
    next();
  });

  // ----------------- mem subscriptions -----------------
  mem.subscribe("state", function(err){
    if(!err){
      log.info(ok
              , "subscribed to channel state" );
      mem.subscribe("worker", function(err){
        if(!err){
          log.info(ok
                  , "subscribed to channel worker" );
          mem.subscribe("exchange", function(err){
            if(!err){
              log.info(ok
                      , "subscribed to channel exchange" );
              mem.subscribe("recipe", function(err){
                if(!err){
                  log.info(ok
                          , "subscribed to recipe channel" );
                  mem.subscribe("start_container_obs", function(err){
                    if(!err){
                      log.info(ok
                              , "subscribed to  start_container_obs channel" );
                      mem.subscribe("stop_container_obs", function(err){
                        if(!err){
                          log.info(ok
                                  , "subscribed to  stop_container_obs channel" );
                          io.listen(conf.io.port)
                          server.listen(conf.info.port, function() {
                            log.info(ok
                                    , "---> info system up and running http://" + conf.info.server + ":" + conf.info.port
                                    );
                            if(_.isFunction(cb)){
                              cb();
                            }
                          });
                        }else{
                          log.error(err
                                   , "can not subscribe to stop_container_obs");
                        }
                      });
                    }else{
                      log.error(err
                               , "can not subscribe to start_container_obs");
                    }
                  });
                }else{
                  log.error(err
                           , "can not subscribe to recipe");
                }
              });
            }else{
              log.error(err
                       , "can not subscribe to exchange");
            }
          });
        }else{
          log.error(err
                   , "can not subscribe to worker");
        }
      });
    }else{
      log.error(err
               , "can not subscribe to state");
    }
  });

  io.on('connection', function (socket){
    log.info(ok
            , "incomming connection, socket connected");
    socket.on('disconnect', function () {
      socket.disconnect();
      log.info(ok
              , "disconnect socket, remaining" );
    });
  }); // io on connection

  // mem --> io
  mem.on("message",  function(ch, path){
    io.sockets.emit(ch, path);
  });
};
