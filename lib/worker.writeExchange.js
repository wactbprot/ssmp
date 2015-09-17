var _        = require("underscore")
  , bunyan   = require("bunyan")
  , logStrm  = require("bunyan-couchdb-stream")
  , deflt    = require("./default")
  , utils    = require("./utils")
  , log = bunyan.createLogger({name: deflt.app.name + ".worker.writeExchange",
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

  log.info(ro,
           "call function writeExchange");

  if(val && exch && path && _.isArray(path) && _.isString(exch)){
    if(task.Customer){
      exch = deflt.misc.custDevPrefix + "-" + exch;
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
