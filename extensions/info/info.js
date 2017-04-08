/**
 * serves infos about the system runtime
 */
module.exports = function(cb) {
  var name     = "info"
    , _        = require("underscore")
    , prog     = require("commander")
    , restify  = require("restify")
    , bunyan   = require("bunyan")
    , broker   = require("sc-broker")
    , get      = require("./get")
    , conf     = require("../../lib/conf")
    , log      = bunyan.createLogger({name: conf.app.name + "." + name,
                                      streams: conf.log.streams
                                     })
    , mem      = broker.createClient({port: conf.mem.port})
    , server   = restify.createServer({name: conf.app.name + "." + name})
    , ok       = {ok: true}
    , ctype    = {'Content-Type': 'text/html'};



  var io = require('socket.io')({pingInterval: conf.io.intervall,
                                 pingTimeout: conf.io.timeout})


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

    server.get(/^\/dev/, function(req, res, next){
      res.writeHead(200, ctype);
      get.devel(function(html){
        res.write(html);
        res.end();
      });
      next();
    });

    server.get(/^\/pub/, function(req, res, next){
      res.writeHead(200, ctype);
      get.pubsub(function(html){
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


    // ----------------- socket.io -----------------
    mem.subscribe("state", function(err){
      if(!err){
        log.info(ok
                , "subscribed to channel state" );
      }else{
        log.error(err
                 , "can not subscribe to state");
      }
    });

    mem.subscribe("worker", function(err){
      if(!err){
        log.info(ok
                , "subscribed to channel worker" );
      }else{
        log.error(err
                 , "can not subscribe to worker");
      }
    });

    mem.subscribe("exchange", function(err){
      if(!err){
        log.info(ok
                , "subscribed to channel exchange" );
      }else{
        log.error(err
                 , "can not subscribe to exchange");
      }
    });

    mem.subscribe("recipe", function(err){
      if(!err){
        log.info(ok
                , "subscribed to recipe channel" );
      }else{
        log.error(err
                 , "can not subscribe to recipe");
      }
    });

    mem.subscribe("start_container_obs", function(err){
      if(!err){
        log.info(ok
                , "subscribed to  start_container_obs channel" );
      }else{
        log.error(err
                 , "can not subscribe to start_container_obs");
      }
    });

    mem.subscribe("stop_container_obs", function(err){
      if(!err){
        log.info(ok
                , "subscribed to  stop_container_obs channel" );
      }else{
        log.error(err
                 , "can not subscribe to stop_container_obs");
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

  io.listen(conf.io.port);
  server.listen(conf.info.port, function() {
    log.info(ok
            , "---> info system up and running @port:" + conf.info.port
            );
    if(_.isFunction(cb)){
      cb();
    }
  });

};