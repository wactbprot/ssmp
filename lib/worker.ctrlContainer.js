var _        = require("underscore")
  , bunyan   = require("bunyan")
  , logStrm  = require("bunyan-couchdb-stream")
  , ndata    = require("ndata")
  , conf     = require("./conf")
  , request  = require("./request")
  , utils    = require("./utils")
  , ro       = {ok: true}, err
  , log      = bunyan.createLogger({name: conf.app.name + ".worker.ctrlContainer",
                                    streams: utils.log_streams
                                   })
  , mem      = ndata.createClient({port: conf.mem.port});
/**
 * Die worker Funktion ```ctrlContainer```
 * erlaubt es taskgesteuert den ctrl-String
 * von Containern zu setzen. Ein Anwendungsbeispiel
 * ist das Starten des Initialisierungscontainers
 * nachdem die KD-ids ausgewählt wurden.
 * @method ctrlContainer
 * @param {Object} task Task-Objekt
 * @param {Function} cb Callback Funktion
 */
module.exports = function (task, cb){
  var path   = task.Path
    , val    = task.Value
  log.trace(ro,
            "call function ctrlContainer");

  if(path && _.isArray(path) && val && _.isObject(val)){
    var containers = _.keys(val)
      , N          = containers.length
      , mpid       = path[0];

    for( var i = 0; i < N; i++ ){
      var no       = containers[i]
      mem.set([mpid, no, "ctrl"], task.Value[no]
             , function (last, n, c){
                 return function (err){
                   if(!err){
                     log.trace(ro
                             , "set container: "
                             + n + " to "
                             + c);
                     if(last){
                       if(_.isFunction (cb)){
                         cb(null, ro);
                       }
                     }
                   }else{
                     log.trace(err
                             ,"error on attempt to set container: "
                             + n + " to "
                             + c);
                     if(_.isFunction (cb)){
                       cb(err);
                     }
                   }
                 }
               }(i == N-1, no, task.Value[no]))
    } //for
  }else{
    err = new Error("unvalid task");
    log.error(err
             , "task is not valid");
    if(_.isFunction (cb)){
      cb(err);
    }
  }
}
