var    _   = require("underscore")
  , bunyan   = require("bunyan")
  , clone    = require("clone")
  , ndata    = require('ndata')
  , net      = require("./net")
  , deflt    = require("./default")
  , request  = require("./request")
  , log      = bunyan.createLogger({name: deflt.app.name + ".load"})
  , mem      = ndata.createClient({port: deflt.mem.port})
  , cstr     = deflt.ctrlStr
  , ok       = {ok:true}
  , err
  , expand_task = require("./load.expandTask")
  , expand_cust = require("./load.expandCust")
  , fetch       = require("./load.fetch")
  , distribute  = require("./load.distribute")
  , insert      = require("./load.insert");
/**
 * Subscriptions
 * @method ini
 * @param {Function} cb
 */
var ini = function (cb){
  mem.subscribe("load", function (err){
    if(!err){
      log.info(ok
              , "load.js subscribed to load channel");
      if(_.isFunction (cb)){
        cb(null, ok)
      }
    }else{
      cb(err);
    }
  });
}
exports.ini = ini;

mem.on('message', function (ch, path){
  if(ch == "load"){
    log.info(ok
            , "load.js received load request");
    load(path);
  }
});

/**
 * Call stack
 * @method all
 * @param {Array} path
 * @param {Function} callback
 */
var load = function (path, cb){

  if(path && _.isArray(path) && (path.length >= 2)){
    var mpid = path[0]
      , no   = path[1];

    mem.publish("stop_container_obs", [mpid, no], function (err){
      if(!err){
        log.info(ok
                , "published to stop_container_obs");
        mem.remove([mpid, no, "state"], function (err){
          if(!err){
            log.info(ok
                    , "removed state");
            mem.publish("state", [mpid, no], function (err){
              if(!err){
                log.info(ok
                        , "published to state");
                mem.remove([mpid, no, "recipe"], function (err){
                  if(!err){
                    log.info(ok
                            , "removed recipe");
                    mem.publish("recipe", [mpid, no], function (err){
                      if(!err){
                        log.info(ok
                                , "published to recipe");
                        mem.get([mpid, "id"], function (err, calibobjs){
                          if(!err){
                            log.info(ok
                                    , "get id");
                            mem.get([mpid, no, "definition"], function (err, def){
                              if(!err){
                                log.info(ok
                                        , "get definition");
                                mem.get([mpid, "meta"], function (err, meta){
                                  if(!err){
                                    log.info(ok
                                            , "get meta");
                                    insert(def, calibobjs, function (err, def){
                                      if(!err){
                                        log.info(ok
                                                , "insert");
                                        distribute([mpid, no], def, meta,  function (err){
                                          if(!err){
                                            log.info(ok
                                                    , "distribute");
                                            mem.publish("start_container_obs", [mpid, no], function (err){
                                              if(!err){
                                                log.info(ok
                                                        , "published start_container_obs");
                                                if(_.isFunction(cb)){
                                                  cb(null, [mpid, no]);
                                                }
                                              }else{
                                                log.error(err
                                                         , "error on publish start_container_obs");
                                                if(_.isFunction(cb)){
                                                  cb(err);
                                                }
                                              }
                                            });
                                          }else{
                                            log.error(err
                                                     , "error on distribute");

                                            if(_.isFunction(cb)){
                                              cb(err);
                                            }
                                          }
                                        }); // distribute
                                      }else{
                                        log.error(err
                                                 , "error on attempt to insert");

                                        if(_.isFunction(cb)){
                                          cb(err);
                                        }
                                      }
                                    }); // insert
                                  }else{
                                    log.error(err
                                             , "error on attempt to get meta");
                                    if(_.isFunction(cb)){
                                      cb(err);
                                    }
                                  }
                                }); // meta
                              }else{
                                log.error(err
                                         , "error on attempt to get definition");

                                if(_.isFunction(cb)){
                                  cb(err);
                                }
                              }
                            }); // definition
                          }else{
                            log.error(err
                                     , "error on attempt to get calibobs");

                            if(_.isFunction(cb)){
                              cb(err);
                            }
                          } // if res ok rm state
                        }); // calibobjs

                      }else{
                        log.error(err
                                 , "error on publish recipe event");

                        if(_.isFunction(cb)){
                          cb(err);
                        }

                      }
                    }); // publish recipe
                  }else{
                    log.error(err
                             , "error on recipe rm");

                    if(_.isFunction(cb)){
                      cb(err);
                    }
                  }
                }); // set recipe to []
              }else{
                log.error(err
                         , "error on publishing to state channel");

                if(_.isFunction(cb)){
                  cb(err);
                }
              }
            }); // publish state
          }else{
            log.error(err
                     , "error on attempt to rm state");

            if(_.isFunction(cb)){
              cb(err);
            }
          } // if res ok rm state
        }); // set state to []
      }else{
        log.error(err
                 , "error on attempt to publish stop_container_obs");

        if(_.isFunction(cb)){
          cb(err);
        }
      }
    }); // stop_container_obs
  }else{
    var err = new Error("wrong path");
    log.error(err
             , "path is not an array or smaller than 2");
    if(_.isFunction(cb)){
      cb(err);
    }
  }
}
exports.load = load;

exports.distribute  = distribute;
exports.fetch       = fetch;
exports.expand_cust = expand_cust;
exports.expand_task = expand_task;
exports.insert       = insert;