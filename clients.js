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
	  log.trace(ok
		    , "run callback");
	  require("./lib/build").ini(function(err){
	      log.trace(ok
			, "build callback");
              require("./lib/observe").ini(function(err){
		  log.trace(ok
			    , "observe callback");
		  require("./lib/mphandle").ini(function(err){
		      log.trace(ok
				, "mphandle callback");
		      require("./lib/cdhandle").ini(function(err){
			  log.trace(ok
				    , "cdhandle callback");

			  log.info(ok
				   , "----> ssmp clients start  with access to port "+ conf.mem.port
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
};
