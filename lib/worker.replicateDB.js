/**
 * @module work.checkDB
 */
var _        = require("underscore")
  , bunyan   = require("bunyan")
  , logStrm  = require("bunyan-couchdb-stream")
  , conf     = require("./conf")
  , utils    = require("./utils")
  , net      = require("./net")
  , request  = require("./request")
  , log      = bunyan.createLogger({name: conf.app.name + ".worker.replicateDB",
                                    streams: conf.log.streams
                                   })
  , ro       = {ok: true}
  , err;

/**
 * Die worker Funktion ```replicateDB()``` repliziert Datenbanken
 * @method replicateDB
 * @param {Object} task Task-Objekt
 * @param {Function} cb Callback Funktion
 */
module.exports = function (task, cb){
  var path     = task.Path;
  if(path && _.isArray(path) ){
    var mpid = path[0];

    log.trace(ro,
              "call function replicateDB");

    net.replicatedb(function(err, con){
      log.trace(con,
                "call connection object for replicateDB");
      var wrtdata = {"source":task.SourceDB,"target":task.TargetDB};
      log.trace(wrtdata,
                "data object for replicateDB");

      request.exec(con, task, JSON.stringify(wrtdata), function(err, res){
        utils.write_to_exchange(task, res, cb);
      }); // exec
    }); // net con
  }else{
    err = new Error("wrong path");
    log.error(err
             , "path missing or is not an array")
    if(_.isFunction (cb)){
      cb(err);
    }
  }
};
