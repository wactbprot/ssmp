var _        = require("underscore")
  , bunyan   = require("bunyan")
  , logStrm  = require("bunyan-couchdb-stream")
  , conf     = require("./conf")
  , utils    = require("./utils")
  , net      = require("./net")
  , request  = require("./request")
  , ro       = {ok: true}, err
  , log      = bunyan.createLogger({name: conf.app.name + ".worker.checkRelay",
                                    streams: conf.log.streams
                                   });

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
  log.trace(ro,
           "call function checkRelay");
  if(path && _.isArray(path) && exchpath && _.isString(exchpath)){
    var  mpid   = path[0]
      , relayinfo

    task.Action = "_version";
    net.relay(function(err, con){
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
      }); // exec
    }); // net con
  }else{
    err = new Error("unvalid task");
    log.error(err
             , "task is not valid")
    if(_.isFunction (cb)){
      cb(err);
    }
  }
};
