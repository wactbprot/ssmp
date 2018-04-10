/**
 * The ssmp clients.
 */
module.exports = function(cb){
  var _       = require("underscore")
    , bunyan  = require("bunyan")
    , conf    = require("./lib/conf")
    , log     = bunyan.createLogger({name: conf.app.name + ".clients",
                                     streams: conf.log.streams
                                    })
    , ok      = {ok:true}
    , err;

  // call to start sc-broker clients
  require("./lib/load").ini(function(err){
      log.trace(ok
		, "load callback");
    require("./lib/run").ini(function(err){
      require("./lib/build").ini(function(err){
        require("./lib/observe").ini(function(err){
          require("./lib/mphandle").ini(function(err){
            require("./lib/cdhandle").ini(function(err){
              require("./lib/exchangeUpdateTime").ini(function(err){
                log.info(ok
                    , "----> ssmp clients start  with access to port "+
                          conf.mem.port
                        );
                if(_.isFunction(cb)){
                    log.info(ok
                          , "execute clients callback");
                  cb();
                }
              });
            });
          });
        });
      });
  });
});
}
