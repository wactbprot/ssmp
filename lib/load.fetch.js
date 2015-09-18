var _        = require("underscore")
  , bunyan   = require("bunyan")
  , ndata    = require('ndata')
  , net      = require("./net")
  , deflt    = require("./default")
  , request  = require("./request")
  , logStrm  = require("bunyan-couchdb-stream")
  , utils    = require("./utils")
  , log = bunyan.createLogger({name: deflt.app.name + ".load.fetch",
                               streams: utils.log_streams
                              })
  , cstr     = deflt.ctrlStr
  , ok       = {ok:true}
  , err
  , mem      = ndata.createClient({port: deflt.mem.port});

/**
 * Holt Task von der DB
 * @method fetch
 * @param {Array} nopath
 * @param {Array} subpath
 * @param {Object} task
 * @param {Function} cb
 */
module.exports = function (path, subpath, pretask, cb){
  if(pretask && _.isObject(pretask) && pretask.TaskName){
    if(path && _.isArray(path) && path.length > 1){
      var mpid = path[0]
        , no   = path[1];

      if(subpath && _.isArray(subpath) && subpath.length > 1){
        var s       = subpath[0]
          , p       = subpath[1]
          , strdata = JSON.stringify(pretask)
          , con     = net.task(strdata)
        request.exec(con, pretask, strdata, function (err, task){
          if(err){
            mem.set([mpid, no, "state", s, p], cstr.error, function (eerr){
              if(!eerr){
                mem.publish("state", [mpid, no, "state", s, p], function (eeerr){
                  if(!eeerr){
                    log.error(err
                             , "set task state to error");
                    if(_.isFunction(cb)){
                      cb(err);
                    }
                  }else{
                    log.fatal(eeerr
                             , "attempt to publish to state");
                    cb(eeerr);
                  }
                }); // publish
              }else{
                log.fatal(eerr
                         , "attempt to set state");
                cb(eerr);
              }
            }); // state set

          }else{
            mem.set([mpid, no, "recipe", s, p], task, function (err){
              if(!err){
                mem.publish("recipe", [mpid, no, "recipe", s, p], function (err){
                  if(!err){
                    mem.set([mpid, no, "state", s, p], cstr.exec, function (err){
                      if(!err){
                        mem.publish("state", [mpid, no, "state", s, p], function (err){
                          if(!err){
                            log.trace(ok
                                    , "task: " + task.TaskName + " loaded and replaced");
                            if(_.isFunction(cb)){
                              cb(null, [mpid, no, "recipe", s, p]);
                            }
                          }else{
                            log.error(err
                                     , "error on publishing state event");
                            if(_.isFunction(cb)){
                              cb(err);
                            }
                          }
                        }); // publish state
                      }else{
                        log.error(err
                                 , "error on set state");
                        if(_.isFunction(cb)){
                          cb(err);
                        }
                      }
                    }); // set state
                  }else{
                    log.error(err
                             ,"error on publish recipe channel");
                    if(_.isFunction(cb)){
                      cb(err);
                    }
                  }
                }); // publish recipe
              }else{
                log.error(err
                         ,"error on try to set task to recipe");
                if(_.isFunction(cb)){
                  cb(err);
                }
              }
            }); // set recipe
          } // task ok
        }); // request
      }else{
        err = new Error("wrong subpath");
        log.error(err
                 ,"the subpath is wrong");
        if(_.isFunction(cb)){
          cb(err);
        }
      }
    }else{
      var err = new Error("wrong path") ;
      log.error(err
               ,"the path is wrong");
      if(_.isFunction(cb)){
        cb(err);
      }
    }
  }else{
    var err =new Error("wrong task");
    log.error(err
             , "the task is wrong");

    if(_.isFunction(cb)){
      cb(err);
    }
  }
}
