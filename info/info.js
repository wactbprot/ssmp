var name     = "info"
  , hc       = require("./template")
  ,  _       = require("underscore")
  , ndata    = require("ndata")
  , bunyan   = require("bunyan")
  , deflt    = require("../lib/default")
  , log      = bunyan.createLogger({name: name})

var mem = ndata.createClient({port: deflt.mem.port});

var defaults = function(cb){
  var  all = {}
  all.default = deflt
  cb(hc["defaults"](all));
}
exports.defaults = defaults;