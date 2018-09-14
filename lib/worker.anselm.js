/**
 * @module work.getList
 */
var _        = require("underscore")
  , bunyan   = require("bunyan")
  , conf     = require("./conf")
  , utils    = require("./utils")
  , net      = require("./net")
  , request  = require("./request")
  , log      = bunyan.createLogger({name: conf.app.name + ".worker.anselm",
                                    streams: conf.log.streams
                                   })
  , ro       = {ok: true}
  , err;

/**
 * Die worker Funktion ```anselm()```
 * connected zur Anselm-API.
 * Die ```task``` benötigt die Einträge  ```task.ListName```
 * und ```task.RequestPath```.
 * Anwendungnsbeispiel: Zieldrücke.
 * @method getList
 * @param {Object} task Task-Objekt
 * @param {Function} cb Callback Funktion
 */
module.exports = function (task, cb){
  var path     = task.Path
    , reqpath = task.RequestPath

  log.trace(ro,
           "call function anselm");

  if(path && _.isArray(path) && reqpath && _.isString(reqpath)){
    var mpid = path[0]
    net.anselm(task, function(err, con){
        log.debug(con)
      request.exec(con, task, false, function(err, data){
          log.debug(data)
        if(!err){
            if(data.ids){
                utils.write_to_id(task, data, cb);
            } else {
                utils.write_to_exchange(task, data, cb);
            }
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
