/**
 * The ssmp data server.
 */
(function(){
  var ndata    = require("ndata")
    , bunyan   = require("bunyan")
    , prog     = require("commander")
    , conf     = require("./lib/conf")
    , defaults = require("./lib/default")
    , ok       = {ok:true}, err
    , log      = bunyan.createLogger({name: conf.app.name + ".server",
                                      streams: conf.log.streams
                                     })
    , server   =  ndata.createServer({port: conf.mem.port});

  prog.version("0.7.1")
  .option("-r, --relay <server>", "name of relay server (default is localhost)")
  .option("-d, --database <server>", "name of database server (default is localhost)")
  .parse(process.argv);

  if(prog.relay){
    defaults.relay.server = prog.relay;
  }

  if(prog.database){
    defaults.database.server = prog.database;
  }

  server.on('ready', function(){
    var mem  = ndata.createClient({port: conf.mem.port})
    log.info(ok
            , "\n"
            + ".....................................\n"
            + "ssmp data server up and running @"
            + conf.mem.port +"\n"
            + ".....................................\n"
            );
    mem.subscribe("load_mp", function(err){
      mem.subscribe("get_cd", function(err){
        mem.subscribe("rm_cd", function(err){
          mem.subscribe("get_mp", function(err){
            mem.subscribe("rm_mp", function(err){
              mem.subscribe("stop_all_container_obs", function (err){
                mem.subscribe("start_container_obs", function (err){
                  mem.subscribe("stop_container_obs", function (err){
                    mem.subscribe(conf.ctrlStr.exec, function (err){
                      mem.subscribe(conf.ctrlStr.load, function (err){
                        mem.subscribe(conf.ctrlStr.stop, function (err){
                          mem.subscribe(conf.ctrlStr.run, function (err){
                            mem.subscribe(conf.ctrlStr.exec, function (err){
                              mem.subscribe("shutdown", function (err){
                                log.trace(ok
                                         , "channel subscription");
                              });
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });

    mem.on('message',function (ch, val){
      log.trace(val
               , "on channel: " + ch);
    });

    mem.set(["defaults"], defaults, function(err){
      log.trace(ok
               , "set defaults");

    }); // set defaults
  });
})()