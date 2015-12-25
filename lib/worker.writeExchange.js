var _        = require("underscore")
  , bunyan   = require("bunyan")
  , logStrm  = require("bunyan-couchdb-stream")
  , conf     = require("./conf")
  , utils    = require("./utils")
  , ro       = {ok: true}, err
  , log      = bunyan.createLogger({name: conf.app.name + ".worker.writeExchange",
                            streams: conf.log.streams
                                   });


/**
 * Die worker Funktion ```writeExchange()``` erlaubt es,
 * zur Laufzeit Einträge in der _exchange_-Schnittstelle
 * zu erstellen.
 * Anwendungsbeispiel: Ein Messgerät kann nicht
 * elektronisch ausgelesen werden; es müssen manuelle
 * Eingabefelder zur Laufzeit erstellt werden.
 *
 * @method writeExchange
 * @param {Object} task Task-Objekt
 * @param {Function} cb Callback Funktion
 */
module.exports = function (task, cb){
  var path   = task.Path
    , exch   = task.ExchangePath
    , val    = task.Value;

  log.trace(ro,
           "call function writeExchange");

  if(val && exch && path && _.isArray(path) && _.isString(exch)){
    if(task.Customer){
      exch = conf.misc.custDevPrefix + "-" + exch;
    }
    utils.write_to_exchange(task, val, cb);
  }else{
    err = new Error("not a valid task");
    log.error(err
             , "missing  ExchangePath or Value")
    if(_.isFunction (cb)){
      cb(err);
    }
  }
};
