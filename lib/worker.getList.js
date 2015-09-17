var _        = require("underscore")
  , bunyan   = require("bunyan")
  , logStrm  = require("bunyan-couchdb-stream")
  , deflt    = require("./default")
  , utils    = require("./utils")
  , net      = require("./net")
  , request  = require("./request")
  , log = bunyan.createLogger({name: deflt.app.name + ".worker.getList",
                               streams: [
                                 {
                                   stream: new logStrm(utils.logurl),
                                   level: 'debug',
                                   type: 'raw'
                                 },{
                                   level: 'info',
                                   stream: process.stdout
                                 }
                               ]
                              })
  , ro       = {ok: true}
  , err;

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

  log.info(ro,
           "call function getList");

  if(path && _.isArray(path) && exchpath && _.isString(exchpath)){
    var mpid = path[0]
      , con  = net.list(task)

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
    });
  }else{
    err = new Error("wrong path")
    log.error(err
             , "path missing or is not an array")
    if(_.isFunction (cb)){
      cb(err);
    }
  }
};
