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

  var io  = require('socket.io').listen(conf.socket.port);

  var mem = ndata.createClient({port: conf.mem.port});

  mem.on('ready', function(){
    log.info({ok: true}
            , "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n"
            + "socket-ssmp up and running @"
            + conf.socket.port +"\n"
            + "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n"
            );
    var channels = ["worker"
                   , "ctrl"
                   , "handle_cd"
                   , "get_mp"
                   , "rm_mp"
                   , "get_cd"
                   , "rm_cd"
                   , "start_container_obs"
                   , "stop_container_obs"
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
                                          , "socket-ssmp.js subscribed to channel: " + c);
                                }
                              }}(channel))
    }

    io.on('connection', function (socket) {
      log.info(ok
              , "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n"
              + "client connection established\n"
              + "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
      socket.emit('connection_active', ok);

      // --- ungefragt ---
      mem.on("message",  function(ch, val){
        var id = val[0]
          , no = val[1]
        log.info(val
                , "event received on channel: " + ch);

        if(ch == "state" && id && no){
          var path = [id, no, "state"];
          mem.get(path, function(err, data){
            socket.emit("state", {path: path,
                                  data: data});
          });
        }
        if(ch == "exchange" && id){
          var path = [id, "exchange"];
          mem.get(path, function(err, data){
            socket.emit("exchange", {path: path,
                                     data: data});
          });
        }
        if(ch == "recipe" && id && no){
          var path = [id, no, "recipe"];
          mem.get(path, function(err, data){
            socket.emit("recipe", {path: path,
                                   data: data});
          });
        }
        if(ch == "handle_cd" && id){
          var path = [id, "id"];
          mem.get(path, function(err, data){
            socket.emit("cdid", {path: path,
                                 data: data});
          })
        }
      });

      // --- gefragt ---
      socket.on("meta", function(id){
        log.info(ok, "meta request to: " + id);
        var path = [id,"meta"];
        mem.get(path,function(err, data){
          socket.emit("meta", {path: path,
                               data: data});
        })
      }); // meta

      /**
       * Laden eines MP- Dokuments über senden
       * der Datenstruktur:
       * ```
       * {
       *  id: id,
       *  cmd: "load"
       * }
       * ```
       * oder des Dokuments
       * ```
       * {_id: ...
       *  Mp: ...
       *  ...
       * }
       * ```
       *
       */
      socket.on("get_mp", function(data){
        var req;
        if(data.id){
          mem.publish("get_mp", data, function(err){
            log.info(ok
                    , "publish get_mp");
          });
        }
      });

      /**
       * Entfernen/ Hinzufügen eines KD  durch Senden
       * der Datenstruktur:
       * ```
       * {
       *  id: id,
       *  cdid: cdid
       *  cmd: "load" ( oder "remove")
       * }
       * ```
       */

      socket.on("handle_cd", function(data){
        mem.publish("handle_cd", data, function(err){
          log.info(ok
                  , "publish handle_cd");
        });
      }); // remove cd

      /**
       * Bedienen des ctrl interfaces
       * mittels
       * ```
       * {
       *  id: id,
       *  no: 0,
       *  cmd: "load;run"
       * }
       * ```
       */
      socket.on("ctrl", function(data){
        var path_c;

        if(data.id && data.no && data.cmd && _.isString(data.cmd)){
          path_c = [data.id, data.no, "ctrl"]
          mem.set(path_c, data.cmd, function(err){
            if(!err){
              socket.emit("ctrl", ok);
            }else{
              socket.emit("ctrl", {error:err});
            }
          });// set ctrl
        }else{
          socket.emit("ctrl", {error:"send unvalid data"});
        }
      }); // load cd
    });
  });
}
module.exports = socket_ssmp;