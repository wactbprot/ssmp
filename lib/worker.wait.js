var _        = require("underscore")
  , bunyan   = require("bunyan")
  , deflt    = require("./default")
  , log      = bunyan.createLogger({name: deflt.app.name + ".worker.wait"})
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
    , wt   = task.WaitTime
    , nwt

  log.info(ro,
           "call function wait");

  if(_.isUndefined(wt)){
    log.warn({warn:"no wait time"}
            , "no wait time given, wait 1 sec");
    nwt  = 1000;
  }

  if(_.isString(wt)){
    log.info(ro
            , "try to parse wait time");
    nwt  = parseInt(wt, 10);
  }

  if(_.isNaN(nwt)){
    err = new Error( "not a number");
    log.error(err
             , "can not parse waittime to number");
    if(_.isFunction (cb)){
      cb(err);
    }
  }else{
    setTimeout(function (){
      log.info(ro,
               "waittime over");
      if(_.isFunction (cb)){
        cb(null, ro);
      }
    }, nwt)
  }
};
