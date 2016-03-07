/**
 * @module work.updateCd
 */
var _        = require("underscore")
  , bunyan   = require("bunyan")
  , logStrm  = require("bunyan-couchdb-stream")
  , broker   = require("sc-broker")
  , conf     = require("./conf")
  , utils    = require("./utils")
  , net      = require("./net")
  , request  = require("./request")
  , ro       = {ok: true}, err
  , log      = bunyan.createLogger({name: conf.app.name + ".worker.updateCd",
                                    streams: conf.log.streams
                                   })
  , mem      = broker.createClient({port: conf.mem.port});

/**
 * Holt die unter /mpid/id/ eingetragenen KDs
 * über update list und schreibt Dokumente zurück
 * auf die DB.
 * @method updateCd
 * @param {Object} task Task-Objekt
 * @param {Function} cb Callback Funktion
 */
module.exports = function (task, cb){
  var path = task.Path;

  log.trace(ro,
            "call function updateCd");
  if(path && _.isArray(path)){
    var mpid   = path[0];
    mem.get([mpid, "id"], function(err, sd){
      if(!err){
        var ids = _.keys(sd)
          , N   = ids.length;
        if(N > 0){
          for(var i = 0; i < N; i++){
            (function(j, id){
              // task has to be cloned in order to avoid
              // conflicts
              var cltask   = JSON.parse(JSON.stringify(task))
              cltask.Param = {id: id};
              net.list(cltask, function(err, rcon){
                log.trace(ro
                         ,"try to update (" + j + "): " + id);
                request.exec(rcon, cltask, false
                            , function (err, updoc){
                                if(updoc._id){
                                  var wrtdata   = JSON.stringify(updoc);
                                  log.trace(ro
                                           ,"try to write doc with id: "
                                           + id);
                                  net.wrtdoc(updoc._id, function(err, wcon){
                                    request.exec(wcon, cltask, wrtdata, function (err, res){
                                      if(res.ok){
                                        log.trace(ro
                                                 ,"doc with id: "
                                                 + res.id
                                                 + " got new revision "
                                                 +  res.rev + " on storing");
                                        log.trace(ro
                                                 , "count is: " + j);
                                        if(j == N - 1){
                                          cb(null, res);
                                        }
                                      }else{
                                        err = new Error("update request");
                                        log.error(err
                                                 , "while try to save updated doc");
                                      }
                                    }); // exec
                                  });// net wcon
                                }else{
                                  err = new Error("update request");
                                  log.error(err
                                           , "object returned by db "
                                           + "has no _id property");
                                  if(_.isFunction (cb)){
                                    cb(err);
                                  }
                                }
                              });
              }); // net rcon

            })(i, ids[i]);
          } // for
        }else{
          log.warn({warn:"no cd id"}
                  , "no calibration doc selected");
          if(_.isFunction (cb)){
            cb(null, ro);
          }
        }
      }else{
        log.error(err
                 , "error on attempt to get id interface");
        if(_.isFunction (cb)){
          cb(err);
        }
      }
    }); // get short doc objects

  }else{
    err = new Error("unvalid task");
    log.error(err
             , "task is not valid");
    if(_.isFunction (cb)){
      cb(err);
    }
  }
}
