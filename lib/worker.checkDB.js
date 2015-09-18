var _        = require("underscore")
  , bunyan   = require("bunyan")
  , logStrm  = require("bunyan-couchdb-stream")
  , deflt    = require("./default")
  , utils    = require("./utils")
  , net      = require("./net")
  , request  = require("./request")
  , log = bunyan.createLogger({name: deflt.app.name + ".worker.checkDB",
                               streams: utils.log_streams
                              })
  , ro       = {ok: true}
  , err;

/**
 * Die worker Funktion ```checkDB()```
 * prüft die Verfügbarkeit der Datenbank über
 * den api Endpunkt /db
 * @method checkDB
 * @param {Object} task Task-Objekt
 * @param {Function} cb Callback Funktion
 */
module.exports = function (task, cb){

  var path     = task.Path;

  if(path && _.isArray(path) ){
    var con  = net.checkdb()
      , mpid = path[0];
    log.trace(ro,
             "call function checkDB");
    request.exec(con, task, false, function(err, dbinfo){

      if(err){
        dbinfo.available = false;
      }else{
        dbinfo.available = false;
      }

      utils.write_to_exchange(task, dbinfo, cb);
    });
  }else{
    err = new Error("wrong path");
    log.error(err
             , "path missing or is not an array")
    if(_.isFunction (cb)){
      cb(err);
    }
  }
};
