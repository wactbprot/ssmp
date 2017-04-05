/**
 * @module work.getTime
 */
var _        = require("underscore")
  , bunyan   = require("bunyan")
  , conf     = require("./conf")
  , utils    = require("./utils")
  , log      = bunyan.createLogger({name: conf.app.name + ".worker.getTime",
                                    streams: conf.log.streams
                                   })
  , ro       = {ok: true}
  , err;


/**
 * Funktion speichert Zeit in ms seit 1970
 * unter angegebeben ```task.DocPath```
 * mit angegebenem ```task.Type```
 * ```Typ``` hat den Defaultwert ```amt```
 * was absolut measure time heisen soll.
 *
 * @method getTime
 * @param {Object} task Task-Objekt
 * @param {Function} cb Callback Funktion
 */
module.exports = function (task, cb){
  var type     = task.Type ? task.Type : "amt"
    , timeobj  = {Type: type,
                  Value: utils.vl_time(),
                  Unit: "ms"}

    , dp = task.DocPath
    , ep = task.ExchangePath

  log.trace(ro,
           "call function gettime");

  if(dp && !ep){
    log.trace(ro
            , "try to call query_cd function")
    utils.query_cd(task,  {Result:[timeobj]}, cb)
  }

  if(ep && !dp){
    log.trace(ro
            , "try to call write_to_exchange function");
    utils.write_to_exchange(task,  timeobj, cb);
  }

  if(ep && dp){
    log.trace(ro
            , "try to call write_to_exchange"
            + " function and query_cd function");
    utils.write_to_exchange(task,  timeobj, function(err){
      if(!err){
        utils.query_cd(task,  {Result:[timeobj]}, cb);
      }else{
        cb(err);
      }
    });
  }

  if(!ep && !dp){
    err = new Error("missing value");
    log.error(err
             , "missing exchangePath or DocPath");
    cb(err);
  }
}
