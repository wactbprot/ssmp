/**
 * The ssmp data server.
 */
module.exports = function(cb){

  var _        = require("underscore")
    , broker   = require("sc-broker")
    , info     = require("./package.json")
    , proc     = require("child_process")
    , bunyan   = require("bunyan")
    , conf     = require("./lib/conf")
    , ok       = {ok:true}, err
    , log      = bunyan.createLogger({name: conf.app.name + ".server",
                                      streams: conf.log.streams
                                     })
  proc.exec('git rev-parse HEAD', function (err, stdout, stderr){
    if(!err){
      info.git  = {commit:stdout};

      broker.createServer({port: conf.mem.port}).on('ready', function(){
        var mem = broker.createClient({port: conf.mem.port});
        log.info(ok
                , " ----> ssmp data server up and running on port: " + conf.mem.port
                );
        mem.set(["info"], info, function(err){
          log.info(ok
                  , "set info");
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
                                      log.info(ok
                                              , "channel subscription");
                                      if(_.isFunction(cb)){
                                        log.info(ok
                                                , "execute callback");
                                        cb();
                                      }
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
        });
      });
    }
  }); //githash
}