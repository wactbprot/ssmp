var name    = "info"
  , hc      = require("./template")
  , bunyan  = require("bunyan")
  , ndata   = require("ndata")
  , conf    = require("../lib/conf")
  , utils   = require("../lib/utils")
  , log     = bunyan.createLogger({name: name})
  , mem     = ndata.createClient({port: conf.mem.port});

var defaults  = function(cb){
  log.info({ok:true}
          , "try generating defaults template");
  mem.get(["defaults"], function(err, defaults){
    cb(hc["defaults"]({default : defaults}));
  });
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

var pubsub  = function(cb){
  log.info({ok:true}
          , "try generating defaults template");
  mem.get(["defaults"], function(err, defaults){
    cb(hc["pubsub"]({default : defaults}));
  });
};
exports.pubsub = pubsub;
