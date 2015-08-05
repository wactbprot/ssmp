var _        = require("underscore")
  , bunyan   = require("bunyan")
  , deflt    = require("./default")
  , utils    = require("./utils")
  , net      = require("./net")
  , request  = require("./request")
  , log      = bunyan.createLogger({name: deflt.app.name + ".worker.checkRelay"})
  , ro       = {ok: true}
  , err;

/**
 * Die worker Funktion ```checkRelay()```
 * prüft die Verfügbarkeit des relay servers über
 * die ```task.Action``` ```_version```.
 * @method checkRelay
 * @param {Object} task Task-Objekt
 * @param {Function} cb Callback Funktion
 */
module.exports = function (task, cb){

  var exchpath = task.ExchangePath
    , path     = task.Path
  log.info(ro,
           "call function checkRelay");
  if(path && _.isArray(path) && exchpath && _.isString(exchpath)){
    var con    = net.relay()
      , mpid   = path[0]
      , relayinfo

    task.Action = "_version";
    request.exec(con, task, JSON.stringify(task), function (err, data){
      if(data && data.Result){
        relayinfo = {version: data.Result
                    , available: true};
      }

      if(err){
        relayinfo = {error: err.message
                    , available: false};
      }
      utils.write_to_exchange(task, relayinfo, cb);
    });
  }else{
    err = new Error("unvalid task");
    log.error(err
             , "task is not valid")
    if(_.isFunction (cb)){
      cb(err);
    }
  }
};
