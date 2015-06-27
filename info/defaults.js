var name     = "info"
  , hc       = require("./template")
  , bunyan   = require("bunyan")
  , deflt    = require("../lib/default")
  , log      = bunyan.createLogger({name: name});

module.exports  = function(cb){
  log.info({ok:true}
          , "try generating defaults template");
  cb(hc["defaults"]({default : deflt}));
}
