var name     = "info"
  , hc       = require("./template")
  ,  _       = require("underscore")
  , ndata    = require("ndata")
  , bunyan   = require("bunyan")
  , deflt    = require("../lib/default")
  , log      = bunyan.createLogger({name: name})

var mem = ndata.createClient({port: deflt.mem.port});

var index = function(cb){
  cb(hc["index"](deflt));
}
exports.index = index;