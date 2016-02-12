/**
 * A simple shutdown
 */
module.exports = function(){

  var broker   = require("sc-broker")
    , pj       = require("./package.json")
    , bunyan   = require("bunyan")
    , conf     = require("./lib/conf")
    , prog     = require("commander")
    , mem      = broker.createClient({port: conf.mem.port})

    , log      = bunyan.createLogger({name: conf.app.name + ".clients",
                                      streams: conf.log.streams
                                     })
    , ok       = {ok:true}
    , err;

  prog.version(pj.version)
  .parse(process.argv);

  mem.publish("shutdown", [], function(err){
    if(!err){
      log.info(ok
              , "published to shutdown channel");
    }else{
      log.error(err
               , "failed to published to shutdown channel");
    }
  });
};