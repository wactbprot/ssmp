var name    = "info"
  , hc      = require("./template")
  , bunyan  = require("bunyan")
  , broker  = require("sc-broker")
  , conf    = require("../../lib/conf")
  , utils   = require("../../lib/utils")
  , log     = bunyan.createLogger({name: name})
  , mem     = broker.createClient({port: conf.mem.port});


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
