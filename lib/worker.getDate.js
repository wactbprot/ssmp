/**
 * @module work.getDate
 */
var _        = require("underscore")
  , bunyan   = require("bunyan")
  , conf     = require("./conf")
  , utils    = require("./utils")
  , log      = bunyan.createLogger({name: conf.app.name + ".worker.getDate",
                                    streams: conf.log.streams
                                   })
  , ro       = {ok: true}
  , err;

/**
 * Funktion speichert Datum im vl format
 * unter angegebeben ```task.DocPath```.
 * Fallback für ```task.Typ``` ist
 * amd, was absolut measure date heisen
 * soll
 *
 * @method getDate
 * @param {Object} task Task-Objekt
 * @param {Function} cb Callback Funktion
 */
module.exports = function (task, cb){
  var path     = task.Path
    , datetype = task.Type ? task.Type : "amd"
    , dp       = task.DocPath
    , ep       = task.ExchangePath
    , dateobj  = {Type: datetype,
                  Value: utils.vl_date()};

  log.trace(ro,
           "call function gettime");

  if(dp && !ep){
    log.trace(ro
            , "try to call query_cd function")
    utils.query_cd(task, {Result:[ dateobj]}, cb)
  }

  if(ep && !dp){
    log.trace(ro
            , "try to call write_to_exchange function");
    utils.write_to_exchange(task,  dateobj, cb);
  }

  if(ep && dp){
    log.trace(ro
            , "try to call write_to_exchange"
            + " function and query_cd function");
    utils.write_to_exchange(task,  dateobj, function(err){
      if(!err){
        utils.query_cd(task, {Result:[ dateobj]}, cb);
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
