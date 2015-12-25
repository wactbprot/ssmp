(function(){
  var ndata     = require("ndata")
    , _         = require("underscore")
    , bunyan    = require("bunyan")
    , conf      = require("./lib/conf")
    , ok        = {ok:true}, err
    , mem       = ndata.createClient({port: conf.mem.port})
    , log       = bunyan.createLogger({name: conf.app.name + ".clients",
                                       streams: conf.log.streams
                                      })
  // call to start ndata clients
    , load     = require("./lib/load")
    , run      = require("./lib/run")
    , build    = require("./lib/build")
    , observe  = require("./lib/observe")
    , mphandle = require("./lib/mphandle")
    , cdhandle = require("./lib/cdhandle")
    , utils    = require("./lib/utils")
  mem.get(["defaults"], function(err, d){
    require("./api/json-srv")(d, function(){
      require("./info/info-srv")(d, function(){
        load.ini(function(err){
          run.ini(function(err){
            build.ini(function(err){
              observe.ini(function(err){
                mphandle.ini(function(err){
                  cdhandle.ini(function(err){
                    if(d.load){
                      mem.publish("get_mp", d.load , function(err){
                        if(!err){
                          log.info(ok
                                  , " published to get_mp channel");
                        }else{
                          log.error(err
                                   , "failed to published to get_mp channel");
                        }
                      });
                    }
                  });
                });
              });
            });
          });
        });
      });
    }); // info server
  }); // get defaults
})();
