var name     = "info"
  , hc       = require("./template")
  , bunyan   = require("bunyan")
  , deflt    = require("../lib/default")
  , utils    = require("../lib/utils")
  , log      = bunyan.createLogger({name: name});

var defaults  = function(cb){
  log.info({ok:true}
          , "try generating defaults template");
  cb(hc["defaults"]({default : deflt}));
};
exports.defaults = defaults;


var devel  = function(cb){
  log.info({ok:true}
          , "try generating devel template");
  var pack = utils.get_jsn("./")

  cb(hc["devel"](pack));
};
exports.devel = devel;


var index  = function(cb){
  log.info({ok:true}
          , "try generating index template");
  var pack = utils.get_jsn("./")

  cb(hc["index"](pack));
};
exports.index = index;
