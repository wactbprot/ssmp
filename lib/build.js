var _        = require("underscore")
  , bunyan   = require("bunyan")
  , ndata    = require('ndata')
  , deflt    = require("./default")
  , utils    = require("./utils")
  , net      = require("./net")
  , request  = require("./request")
  , log      = bunyan.createLogger({name: deflt.app.name})
  , cstr     = deflt.ctrlStr
  , ok       = {ok:true}
  , err
  , mem      = ndata.createClient({port: deflt.mem.port})

/**
 * Initiiert Subscription auf load_mp channel
 * @method ini
 * @param {Function} cb
 */
var ini = function(cb){
  mem.subscribe("load_mp", function(err){
    if(!err){
      log.info(ok
              , "build subscribed to load_mp channel");
      if( _.isFunction (cb)){
        cb(null, ok);
      }
    }else{
      cb(err);
    }
  })
}
exports.ini = ini;

mem.on('message', function(ch, val){
  if(ch == "load_mp"){
    load_mp(val, function(err, path){
      if(!err){
        log.info(ok
                , "mp loaded");
      }else{
        log.info({error:err}
                , "error on loading mp");
      }
    });
  } // if build
}); // on build


var load_mp = function(val, cb){
  var mpid = val._id
    , i
    , doc   = val.Mp
  if(mpid && _.isString(mpid) &&!_.isEmpty( mpid) && doc && _.isObject(doc)){
    var dc    = doc.Container;
    mem.publish("stop_all_container_obs", [mpid], function(err){
      setTimeout(function(){
        if(!err){
          mem.remove([mpid], function(err){
            if(!err){
              log.info(ok
                      , "clean up: " + mpid);
              build_base([mpid], val, function(err, path){
                if(dc && _.isArray(dc) && dc.length > 0){
                  for(i = 0; i < dc.length; i++){
                    ((function(j){
                        return function(){
                          var def_cont = dc[j];
                          if(_.isObject(def_cont)){
                            if(def_cont.Take && def_cont.From){
                              log.info(ok
                                      , "found container reference, try to get from db");
                              var con = net.container(def_cont)
                                , s   = JSON.stringify({ take: def_cont.Take
                                                       , from: def_cont.From});
                              request.exec(con, false, s, function(err, db_cont){
                                if(_.isObject(db_cont) && db_cont.Definition){
                                  log.info(ok
                                          , "received container, try to build");
                                  utils.replace_all(db_cont, def_cont.Replace, function(repl_cont){
                                    build_container([mpid, j], repl_cont, function(err, path){
                                      if(!err){
                                        mem.publish("start_container_obs", [mpid, j], function(err){
                                          if(!err){
                                            log.info(ok
                                                    , "start_container_obs event published for container:"
                                                    + j + ", exec callback");
                                            if(_.isFunction(cb)){
                                              cb(null, path)
                                            }
                                          }else{

                                            log.error(err
                                                     , "error on publishing build event");
                                            if(_.isFunction(cb)){
                                              cb(err, path)
                                            }
                                          }
                                        });
                                      } // last
                                    }); // buildcontainer
                                  }); // replace_all
                                }else{
                                  err = new Error("container not found");
                                  log.error(err
                                           , "requested container can not be found at db");
                                  if(_.isFunction(cb)){
                                    cb(err, path)
                                  }
                                }
                              })
                            }else{
                              log.info(ok
                                      , "found container in mp document");
                              build_container([mpid, j], def_cont, function(err, path){
                                if(!err){
                                  mem.publish("start_container_obs", [mpid, j], function(err){
                                    if(!err){
                                      log.info(ok
                                              , "start_container_obs event published for container:" + j+ ", exec callback");
                                      if(_.isFunction(cb)){
                                        cb(null, path)
                                      }
                                    }else{
                                      log.error(err
                                               , "error on publishing build event")
                                      if(_.isFunction(cb)){
                                        cb(err, path)
                                      }
                                    }
                                  }); // publish
                                } // last
                              }); // build_containers
                            }
                          }else{ // container is Object
                            err = new Error("unvalid container");
                            log.error(err
                                     , "given container is not an object");
                            if(_.isFunction(cb)){
                              cb(err, [])
                            }
                          }
                        }})(i))();
                  } //for containers
                }else{ // doc.containers
                  log.warn({warn:"no container"}
                          , "mp has no container definition");
                  if(_.isFunction(cb)){
                    cb(null, [mpid])
                  }
                }
              }); // build base
            }else{
              log.error(err
                       , "error on attempt to clean up: " + mpid);
            }
          }); // remove
        }else{
          log.error(err
                   , "error on attempt to publish stop_container_obs: " + mpid);
        }
      }, 2 * deflt.container.heartbeat);
    }); // publish stop_container_obs
  }else{
    err = new Error("unvalid mp document");
    log.error(err
             , "given object seems to be not a mp-document");
    if(_.isFunction(cb)){
      cb(err, [])
    }
  }
}
exports.load_mp = load_mp;

/**
 * Baut Container aus MP-Definition
 * @method build_container
 * @param {Array} path
 * @param {Array} container
 * @param {Function} cb
 */
var build_container = function(path, container, cb){
  var strpath = path.join(" ")
    , ro
  log.info(ok
          , "try to build container: " + strpath);
  mem.set(path.concat(["ctrl"]), container["Ctrl"] || cstr.ready, function(err){
    if(!err){
      log.info(ok
              , "add ctrl to container: " + strpath);
      mem.set(path.concat(["element"]), container["Element"] || [],function(err){
        if(!err){
          log.info(ok
                  , "add element to container: " + strpath);
          mem.set(path.concat(["contdescr"]), container["Description"] || "__description__", function(err){
            if(!err){
              log.info(ok
                      , "add container description to : " + strpath);
              mem.set(path.concat(["title"]), container["Title"] || "__title__", function(err){
                if(!err){
                  log.info(ok
                          , "add title to container: " + strpath);
                  mem.set(path.concat(["definition"]), container["Definition"] || [[{}]], function(err){
                    if(!err){
                      log.info(ok
                              , "add definition to container: " + strpath);
                      mem.get(path.concat(["definition"]), function(err, definition){

                        utils.cp( definition , cstr.ready, function(err, defcp){
                          // if err ...
                          mem.set(path.concat(["state"]), defcp, function(err){

                            mem.publish("state", path, function(err){
                              if(!err){
                                log.info(ok
                                        , "sync definition and state of container: " + strpath);
                                if(_.isFunction(cb)){
                                  cb(null, path);
                                }
                              }
                            }); // publish state
                          });
                        });
                      });
                    }else{
                      log.error(err
                               , "error on attempt to set definition");
                      if(_.isFunction(cb)){
                        cb(err, path);
                      }
                    }
                  });
                }else{
                  log.error(err
                           , "error on attempt to set container title");
                  if(_.isFunction(cb)){
                    cb(err, path);
                  }
                }
              });
            }else{
              log.error(err
                       , "error on attempt to set container description");
              if(_.isFunction(cb)){
                cb(err, path);
              }
            }
          });
        }else{
          log.error(err
                   , "error on attempt to set element");
          if(_.isFunction(cb)){
            cb(err, path);
          }
        }
      });
    }else{
      log.error(err
               , "error on attempt to set ctrl");
      if(_.isFunction(cb)){
        cb(err, path);
      }
    }
  });
};

/**
 * Baut Basis des Messprogramms aus MP-Definition.
 * @method build_base
 * @param {Array} path
 * @param {Object} mpdoc
 * @param {Function} cb
 */
var build_base = function(path, mpdoc, cb){
  var meta  = {}
    , doc   = mpdoc.Mp
    , d     = [{Type: "build", Value: utils.vl_date()}]
    , ct    = []
    , dc    = doc.Container

  for(var i in dc){
    var t = dc[i].Title;
    if(_.isUndefined(t)){
      t = (dc[i].Take && dc[i].From) ? "From doc: " +  dc[i].From + ": " + dc[i].Take :  "__container title__";
    }
      ct.push(t);
  }

  meta.id          = mpdoc._id       || "";
  meta.rev         = mpdoc._rev      || "";

  meta.date        = doc.Date        || d
  meta.standard    = doc.Standard    || "";
  meta.description = doc.Description || "__descr__";
  meta.name        = doc.Name        || "__name__" ;
  meta.container   = {N :ct.length,
                      Title: ct};

  mem.set(path.concat(["meta"]), meta, function(err){
    mem.set(path.concat(["exchange"]), doc.Exchange || {}, function(err){
      mem.set(path.concat(["definitions"]), doc.Definitions || [], function(err){
        mem.set(path.concat(["tasks"]), doc.Tasks || [], function(err){
          mem.set(path.concat(["id"]), {}, function(err){
            log.info(ok, "build base mp");
            if(_.isFunction(cb)){
              cb(null, path);
            }
          }); // id
        }); // tasks
      }); // definitions
    }); // exchange
  }); // meta
};
