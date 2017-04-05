/**
 * The ssmp clients.
 */
module.exports = function(cb){

  var broker    = require("sc-broker")
    , pj        = require("./package.json")
    , _         = require("underscore")
    , prog      = require("commander")
    , bunyan    = require("bunyan")
    , conf      = require("./lib/conf")
    , ok        = {ok:true}, err
    , mem       = broker.createClient({port: conf.mem.port})
    , log       = bunyan.createLogger({name: conf.app.name + ".clients",
                                       streams: conf.log.streams
                                      });
  prog.version(pj.version)
  .option("-l, --load <mpid>", "the id of an mp-definition to load on start")
  .parse(process.argv);

  log.info(ok
          , "----> ssmp clients start  with access to port "+ conf.mem.port
          );

  // call to start sc-broker clients
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
                      log.info(ok
                              , " published to get_mp channel");
                    }else{
                      log.error(err
                               , "failed to published to get_mp channel");
                    }
                  });
                }
                if(_.isFunction(cb)){
                  log.trace(ok
                           , "execute callback");
                  cb();
                }
              });
            });
          });
        });
      });
    });
  }); // get defaults
};
