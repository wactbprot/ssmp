var _        = require("underscore")
  , bunyan   = require("bunyan")
  , clone    = require("clone")
  , broker   = require("sc-broker")
  , conf     = require("../../../lib/conf")
  , log      = bunyan.createLogger({name: "chart.methods"})
  , ctrlstr  = conf.ctrlStr
  , ok       = {ok:true}
  , err;

var mem = broker.createClient({port: conf.mem.port});

/**
 * Listet alle geladenen mps
 * @param {Object} req Request-Objekt
 * @param {Function} cb call back
 */
var available = function(req, cb){
  var ret = [];
  mem.getAll(function(err, mps){
    if(!err){
      for(mp in mps){
        if(mps[mp]["exchange"]){
          var exch =  mps[mp]["exchange"]
          for(entr in exch) {
            if(exch[entr]["Value"]) {
              ret.push([mp, "exchange", entr, "Value"])
            }
          }
        }
      }

      cb(null,ret);
    }else{
      err = new Error("on attempt to mem.getAll()");
      log.error(err
               , " error on attempt to get all");
      if(_.isFunction(cb)){
        cb(err);
      }
    }
  });
}
exports.available = available;

var data = function(req, cb){
  var mpid  = req.params.mpid
    , obs    = req.params.obs;
    mem.get([mpid, "exchange", "update_time", "Value"], function(err, up){
      mem.get([mpid, "exchange", obs, "Value"], function(err, dat){
        cb(null,{x:up, y:dat});
      });
    });
}
exports.data = data;
