var socket_ssmp = function(conf) {
  var name    = "socket-ssmp"
    , ndata   = require("ndata")
    , prog    = require("commander")
    , _       = require("underscore")
    , bunyan  = require("bunyan")
    , deflt   = require("./lib/default")
    , cstr    = deflt.ctrlStr
    , log     = bunyan.createLogger({name: name})
    , ok      = {ok:true};




  var io  = require('socket.io').listen(conf.socketport);

  var mem = ndata.createClient({port: conf.memport});

  mem.on('ready', function(){

    log.info({ok: true}
            , "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n"
            + "socket-ssmp up and running @"
            + conf.socketport +"\n"
            + "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n"
            );

    var channels = ["worker"
                   , "ctrl"
                   , "load_cd"
                   , "load_mp"
                   , "buildup"
                   , "builddown"
                   , "recipe"
                   , "exchange"
                   , "state"
                   , cstr.exec
                   , cstr.load
                   , cstr.run
                   ];

    for(var i in channels){
      var channel = channels[i];
      mem.subscribe(channel,function(c){
                              return function(err){
                                if(!err){
                                  log.info(ok
                                          , "mem.js subscribed to channel: " + c);
                                }
                              }}(channel))
    }

    io.on('connection', function (socket) {

      log.info(ok
              , "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n"
              + "client connection established\n"
              + "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");

      socket.emit('connection_active', ok);

      mem.on("message",  function(ch, val){
        log.info(val, "event received on channel: " + ch);
        if(ch == "state"){
          mem.get([val[0], val[1], "state"], function(err, data){
            socket.emit('state', data);
          })
        }
      });

      socket.on("meta", function(id){
        log.info(ok, "meta request to: " + id);
        mem.get([id,"meta"],function(err, data){
          socket.emit("meta", data);
        })
      });
    });
  });
}
module.exports = socket_ssmp;