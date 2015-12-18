var _        = require("underscore")
  , bunyan   = require("bunyan")
  , logStrm  = require("bunyan-couchdb-stream")
  , conf     = require("./conf")
  , utils    = require("./utils")
  , net      = require("./net")
  , request  = require("./request")
  , ro       = {ok: true}, err
  , log = bunyan.createLogger({name: conf.app.name + ".worker.getList",
                               streams: utils.log_streams
                              });
/**
 * Die worker Funktion ```getList()```
 * holt Daten von einer Datenbank-List-Abfrage.
 * Die ```task``` benötigt die Einträge  ```task.ListName```
 * und ```task.ViewName```.
 * Anwendungnsbeispiel: Datensätze zur Auswahl
 * eines Kalibrierdokuments.
 * @method getList
 * @param {Object} task Task-Objekt
 * @param {Function} cb Callback Funktion
 */
module.exports = function (task, cb){
  var path     = task.Path
    , exchpath = task.ExchangePath

  log.trace(ro,
           "call function getList");

  if(path && _.isArray(path) && exchpath && _.isString(exchpath)){
    var mpid = path[0]
    net.list(task, function(err, con){

      request.exec(con, task, false, function(err, data){
        if(!err){
          utils.write_to_exchange(task, data, cb);
        }else{
          log.error(err
                   , "error in request cb")
          if(_.isFunction (cb)){
            cb(err);
          }
        }
      }); // exec
    }); // net con
  }else{
    err = new Error("wrong path")
    log.error(err
             , "path missing or is not an array")
    if(_.isFunction (cb)){
      cb(err);
    }
  }
};
