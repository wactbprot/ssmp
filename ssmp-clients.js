/**
 * The ssmp clients.
 */
module.exports = function(){
  var ndata     = require("ndata")
    , _         = require("underscore")
    , prog      = require("commander")
    , bunyan    = require("bunyan")
    , conf      = require("./lib/conf")
    , ok        = {ok:true}, err
    , mem       = ndata.createClient({port: conf.mem.port})
    , log       = bunyan.createLogger({name: conf.app.name + ".clients",
                                       streams: conf.log.streams
                                      });
  prog.version("0.7.1")
  .option("-l, --load <mpid>", "the id of an mp-definition to load on start")
  .parse(process.argv);

  // call to start ndata clients
  var load     = require("./lib/load")
    , run      = require("./lib/run")
    , build    = require("./lib/build")
    , observe  = require("./lib/observe")
    , mphandle = require("./lib/mphandle")
    , cdhandle = require("./lib/cdhandle")
    , utils    = require("./lib/utils")
  mem.get(["defaults"], function(err, d){
    load.ini(function(err){
      run.ini(function(err){
        build.ini(function(err){
          observe.ini(function(err){
            mphandle.ini(function(err){
              cdhandle.ini(function(err){
                if(prog.load){
                  mem.publish("get_mp", prog.load , function(err){
                    if(!err){
                      log.trace(ok
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
  }); // get defaults
};
