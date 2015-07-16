/**
 * serves infos about thr running system
 */
var info_srv = function(conf, cb) {
  var name     = "info"
    , ok       = {ok: true}
    , _        = require("underscore")
    , prog     = require("commander")
    , restify  = require("restify")
    , bunyan   = require("bunyan")
    , ndata    = require("ndata")
    , get      = require("./get")
    , log      = bunyan.createLogger({name: name})
    , server   = restify.createServer({name: name})
    , io       = require('socket.io')({pingInterval: 100,
                                       pingTimeout: 200})
    , mem      = ndata.createClient({port: conf.mem.port});

  io.listen(conf.io.port);

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

/**
 * I's maybe a good idea to provide a
 * human readable page as entrance
 */

  server.get(/^\/def/, function(req, res, next){
    res.writeHead(200, {
      'Content-Type': 'text/html'
    });
    get.defaults(function(html){
      res.write(html);
      res.end();
    });
    next();
  });

  server.get(/^\/dev/, function(req, res, next){
    res.writeHead(200, {
      'Content-Type': 'text/html'
    });
    get.devel(function(html){
      res.write(html);
      res.end();
    });
    next();
  });

  server.get(/^\/pub/, function(req, res, next){
    res.writeHead(200, {
      'Content-Type': 'text/html'
    });
    get.pubsub(function(html){
      res.write(html);
      res.end();
    });
    next();
  });

  // everything else
  server.get(/^[\/]?/, function(req, res, next){
    res.writeHead(200, {
      'Content-Type': 'text/html'
    });
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
      log.error({error:err}
               , "can not subscribe to state");
    }
  });

  mem.subscribe("worker", function(err){
    if(!err){
      log.info(ok
              , "subscribed to channel worker" );
    }else{
      log.error({error:err}
               , "can not subscribe to worker");
    }
  });

  mem.subscribe("exchange", function(err){
    if(!err){
      log.info(ok
              , "subscribed to channel exchange" );
    }else{
      log.error({error:err}
               , "can not subscribe to exchange");
    }
  });


  mem.subscribe("recipe", function(err){
    if(!err){
      log.info(ok
              , "subscribed to recipe channel" );
    }else{
      log.error({error:err}
               , "can not subscribe to recipe");
    }
  });

  mem.subscribe("start_container_obs", function(err){
    if(!err){
      log.info(ok
              , "subscribed to  start_container_obs channel" );
    }else{
      log.error({error:err}
               , "can not subscribe to start_container_obs");
    }
  });

  mem.subscribe("stop_container_obs", function(err){
    if(!err){
      log.info(ok
              , "subscribed to  stop_container_obs channel" );
    }else{
      log.error({error:err}
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

  mem.on("message",  function(ch, path){
    io.sockets.emit(ch, path);
  })


  //
  // --- go!---
  //
  server.listen(conf.info.port, function() {
    log.info(ok
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