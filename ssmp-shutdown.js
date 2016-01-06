/**
 * A simple shutdown
 */
module.exports = function(){
  var ndata    = require("ndata")
    , bunyan   = require("bunyan")
    , conf     = require("./lib/conf")
    , prog     = require("commander")
    , mem      = ndata.createClient({port: conf.mem.port})
    , ok       = {ok:true}, err
    , log      = bunyan.createLogger({name: conf.app.name + ".clients",
                                       streams: conf.log.streams
                                      });
  prog.version("0.7.1")
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