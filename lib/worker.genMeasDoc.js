/**
 * @module work.wait
 */
var _        = require("underscore")
  , bunyan   = require("bunyan")
  , conf     = require("./conf")
  , utils    = require("./utils")
  , log      = bunyan.createLogger({name: conf.app.name + ".worker.wait",
                                    streams: conf.log.streams
                                   })
  , ro       = {ok: true}
  , err;


/**
 * ```wait()``` verzögert den Ablauf um die unter
 * ```task.WaitTime``` angegebene Zeit in ms.
 * Defaultwert ist eien Wartezeit von 1000ms
 * @method wait
 * @param {Object} task Task-Objekt
 * @param {Function} cb Callback Funktion
 */
module.exports = function(task, cb){
  var path = task.Path
    , mdoc   = task.Value


  log.info(ro,
           "generate measurement doc with id: " + mdoc._id);

};
