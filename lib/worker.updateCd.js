var _        = require("underscore")
  , bunyan   = require("bunyan")
  , logStrm  = require("bunyan-couchdb-stream")
  , ndata    = require("ndata")
  , deflt    = require("./default")
  , utils    = require("./utils")
  , net      = require("./net")
  , request  = require("./request")
  , log = bunyan.createLogger({name: deflt.app.name + ".worker.updateCd",
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
  , mem      = ndata.createClient({port: deflt.mem.port})
  , ro       = {ok: true}
  , err;

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

  log.info(ro,
           "call function updateCd");
  if(path && _.isArray(path)){
    var mpid   = path[0];

    mem.get([mpid, "id"], function(err, sd){
      if(!err){
        var ids = _.keys(sd)
          , N   = ids.length;

        if(N > 0){
          for(var i = 0; i < N; i++){
            var id     = ids[i];
            log.info(ro
                    ,"try to update: " + id)

            task.Param = {id: id};
            request.exec(net.list(task), task, false
                        , function (last, id){
                            return function (err, updoc){
                              if(updoc._id){
                                var wrtcon    = net.wrtdoc(updoc._id)
                                  , wrtdata   = JSON.stringify(updoc);
                                log.info(ro
                                        ,"try to write doc with id: "
                                        + id)
                                request.exec(wrtcon, task, wrtdata, function (err, res){
                                  if(res.ok){
                                    log.info(ro
                                            ,"doc with id: "
                                            + res.id
                                            + " got new revision "
                                            +  res.rev + " on storing");
                                    if(last){
                                      cb(null, res);
                                    }
                                  }else{
                                    err = new Error("update request");
                                    log.error(err
                                             , "while try to save updated doc")
                                  }
                                });
                              }else{
                                err = new Error("update request");
                                log.error(err
                                         , "object returned by db "
                                         + "has no _id property")
                                if(_.isFunction (cb)){
                                  cb(err)
                                }
                              }
                            }
                          }(i == N-1, id))
          }
        }else{
          log.warn({warn:"no cd id"}
                  , "no calibration doc selected");
          if(_.isFunction (cb)){
            cb(null, ro)
          }
        }
      }else{
        log.error(err
                 , "error on attempt to get id interface");
        if(_.isFunction (cb)){
          cb(err)
        }
      }
    }); // get short doc objects
  }else{
    err = new Error("unvalid task");
    log.error(err
             , "task is not valid")
    if(_.isFunction (cb)){
      cb(err);
    }
  }
}
