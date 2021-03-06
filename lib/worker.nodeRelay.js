/**
 * @module work.nodeRelay
 */
var _        = require("underscore")
  , bunyan   = require("bunyan")
  , conf     = require("./conf")
  , utils    = require("./utils")
  , net      = require("./net")
  , request  = require("./request")
  , log      = bunyan.createLogger({name: conf.app.name + ".worker.nodeRelay",
                                    streams: conf.log.streams
                                   })
  , ro       = {ok: true}
  , err;

/**
 * (Mess-) Aufträge an den _node-relay_-server
 * werden an diesen mit der ```nodeRelay()```
 * Funktion gesandt.
 * @method nodeRelay
 * @param {Object} task Task-Objekt
 * @param {Function} cb Callback Funktion
 */
module.exports = function (task, cb){
  var path    = task.Path;

  log.trace(ro,
           "call function nodeRelay"
              + "try request to nodeRelay");
  if(path && _.isArray(path)){
    var  wrtdata = JSON.stringify(task);
    net.relay(function(err, con){
      request.exec(con, task, wrtdata, function (err, data){
          log.trace(ro,
           "start vxi11_buffer_time before processing data received from relayServer");
        // delay data processing, testing vxi-11
        setTimeout(function(){
          log.trace(ro,
           "end vxi11_buffer_time before processing data received from relayServer");
        if(!data && err){
          log.error(err
                   , "received error in callback");
          cb(err);
        }
        if(data){
          log.trace(ro
                   , "request callback succesful");
          if(data.ok){
            log.trace(ro
                     , " exec callback with simple ok");
            cb(null, data);
          }else{
            var dp = !_.isUndefined(task.DocPath)
              , ep = !_.isUndefined(data.ToExchange)
              , rr = !_.isUndefined(data.Result) ;

            if(dp && ep){
              log.trace(ro
                       , "found DocPath and ToExchange, try to save");
              utils.query_cd(task, data, function (err, res){
                if(!err){
                  log.trace(ro,
                            "try to write to exchange");
                  utils.write_to_exchange(task, data, cb);
                }else{
                  log.error(err,
                            "try to write to exchange");
                  cb(err);
                }
              })
            } // dp & ep

            if(dp && !ep){
              log.trace(ro,
                        "found DocPath and Results try to save");
              utils.query_cd(task, data, cb)
            } // dp && !ep

            if(!dp && ep){
              log.trace(ro,
                        "found ToExchange, try to exchange");
              utils.write_to_exchange(task, data, cb)

            } //!dp && ep

            if(!dp && !ep && rr){
              log.trace(ro,
                        "simple pass with Result: "
                           + JSON.stringify(data.Result));
              cb(null, ro);
            } //!dp && ep
          } // else data.ok
        } // data.error
      }, conf.system.vxi11_buffer_time); // wait before process data, vxi11 testing
      }); // exec
    }); // net con
  }else{
    err = new Error("wrong path")
    log.error(err,
              "missing path or path is not an array");
    if(_.isFunction(cb)){
      cb(err);
    }
  }
};
