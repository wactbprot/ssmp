var _        = require("underscore")
  , bunyan   = require("bunyan")
  , logStrm  = require("bunyan-couchdb-stream")
  , net      = require("./net")
  , conf     = require("./conf")
  , request  = require("./request")
  , utils    = require("./utils")
  , ok       = {ok: true}, err
  , log      = bunyan.createLogger({name: conf.app.name + ".utils.queryCd",
                                    streams: utils.log_streams
                                   })
  , data_to_doc = require("./utils.dataToDoc");

/**
 * Die Funktion ```query_cd()``` holt
 * ein Kalibrierdokument (aka KD
 * oder cd: calibration document) von der Datenbank
 * ruft die Funktion ```data_to_doc()``` auf und
 * übergibt dieser Funktion als callback den Auftrag
 * zum wieder Abspeichern des nun aufgefüllten cd.
 * @method query_cd
 * @param {Object} task Task-Objekt
 * @param {Object} data Objekt mit Result key
 * @param {Function} cb Callback Funktion
 */
module.exports = function (task, data, cb){
  if( task && _.isObject(task)){

    if(task.Id && task.Id.length  > 0){
      // todo: wo wird was getestet; wo data, wo docpath noch ...
     if(task.DocPath){
        var Id      = task.Id,
            Nid     = Id.length;
        for(var i = 0; i < Nid; i++){
          (function(j){
            request_cd(task, Id[j], data, j == Nid -1, cb);
          })(i);
        } // for
      }else{
        err = new Error("with given data");
        log.error(err
                 , "test on task.DocPath  failed");
        if(_.isFunction (cb)){
          cb(err);
        }
      }
    }else{
      log.warn({warn:"no or empty Id array"},
               "seems to be a test; no calibration doc selected");
      if(_.isFunction (cb)){
        cb(null
          , { ok:true
            , warn: "empty Id array"});
      }
    }
  }else{
    err = new Error("no task");
    log.error(err
             , "test on task failed");
    if(_.isFunction (cb)){
      cb(err);
    }
  }
};

var request_cd = function(task, id, data,  last, cb){
  net.rddoc(id, function(err,rcon){
    request.exec(rcon, task, false
                , function (err, doc){
                    if(err){
                      if(_.isFunction (cb)){
                        cb(err);
                      }
                    }else{
                      log.trace(ok,
                                "get doc try to store date in it");
                      data_to_doc(doc, task.DocPath, data
                                 , function (err, doc){
                                     if(!err && doc._id){

                                       log.trace(ok
                                                ,"doc filled up with date try to store back");
                                       net.wrtdoc(id, function(err, wcon){
                                         request.exec(wcon, task, JSON.stringify(doc)
                                                     , function (err, res){
                                                         if(err){
                                                           if(err.message == "conflict"){
                                                             var delay = Math.random() * 1000;

                                                             log.warn(err
                                                                     , "conflict on attempt "
                                                                     + "to save doc, retry in (random): "
                                                                     + delay + "ms");
                                                             // write data again
                                                             setTimeout(function(){
                                                               request_cd(task, id, data,  last, cb);
                                                               log.warn(ok
                                                                       , "delay time "
                                                                       + delay + "ms over,  "
                                                                       + "retry to save doc");
                                                             }, delay);
                                                           }else{
                                                             err = new Error("error on attempt to save doc");
                                                             log.error(err
                                                                      , "error on attempt to save doc");
                                                             if(_.isFunction (cb)){
                                                           cb(err);
                                                             }
                                                           }
                                                         }else{
                                                           log.trace(res
                                                                    ,"save doc with id: "
                                                                    + res.id);
                                                           if(last){
                                                             log.trace(ok
                                                                      ,"saved all docs");
                                                             if(_.isFunction (cb)){
                                                               cb(null, res);
                                                             }
                                                           }
                                                         }
                                                       });
                                       }); // net wcon
                                   }else{
                                     log.error(err
                                              , "data_to_doc returns execs cb witherror");
                                   }
                                 });
                  }
                });
  }); // net rcon
}
