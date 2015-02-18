var _        = require("underscore")
  , bunyan   = require("bunyan")
  , ndata    = require('ndata')
  , deflt    = require("./default")
  , utils    = require("./utils")
  , net      = require("./net")
  , request  = require("./request")
  , log      = bunyan.createLogger({name: deflt.appname})
  , cstr     = deflt.ctrlStr
  , ok       = {ok:true}
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
      if(_.isFunction(cb)){
        cb();
      }
    }
  })
}
exports.ini = ini;

mem.on('message', function(ch, val){
  if(ch == "load_mp"){
    var i
      , doc   = val.Mp
      , dc    = doc.Container
      , Ndc   = dc ? dc.length : 0;

    if(doc){
      var docid = val._id
      mem.publish("builddown", [docid], function(err){
        if(!err){
          mem.remove([docid], function(err){
            if(!err){
              log.info(ok
                      , "clean up: " + docid);
              build_base([docid], val, function(path){
                if(dc){
                  for(i = 0; i < Ndc; i++){
                    ((function(j){
                        var def_cont   = dc[j]
                          , path_c = path.concat([j])
                          , cb     = function(res){
                              if(res.ok){
                                if(j == Ndc - 1){
                                  mem.publish("buildup", [docid], function(err){
                                    if(!err){
                                      log.info(ok
                                              , "mp builded, event published, exec callback");
                                    }else{
                                      log.error({error:err}
                                               , "error on publishing build event")
                                    }
                                  });
                                } // last
                              }else{
                                log.error(res
                                         , "error on attempt to build")
                              }
                            }
                        return function(){
                          if(_.isObject(def_cont)){
                            if(def_cont.Take && def_cont.From){
                              log.info(ok
                                      , "found container reference, try to get from db");

                              var con = net.container(def_cont)
                                , s   = JSON.stringify({take:def_cont.Take, from:def_cont.From})
                              // db request
                              request.exec(con, false, s, function(db_cont){
                                if(_.isObject(db_cont) && db_cont.Definition){
                                  // replace
                                  if(def_cont.Replace && _.isObject(def_cont.Replace)){
                                    log.info(ok
                                            , "found replace key on container level"
                                            + " try to substitude");

                                    var str_cont = JSON.stringify(db_cont)
                                    for(var j in def_cont.Replace){
                                      var patt = new RegExp( j ,"g");
                                      str_cont  = str_cont.replace(patt, def_cont.Replace[j]);
                                    }
                                  } // if replace

                                  log.info(ok
                                          , "received container, try to build");
                                  build_container(path_c, db_cont, cb);
                                }
                              })
                            }else{
                              log.info(ok
                                      , "found container, try to get from db");

                              build_container(path_c, def_cont, cb);
                            }
                          } // is Object
                        }
                      })(i))();
                  } //for
                }else{
                  log.warn({warn:"no container"}
                          , "mp has no container definition");
                }
              }); // build base
            }else{
              log.error({error:err}
                       , "error on attempt to clean up: " + docid);
            }
          }); // remove
        }else{
          log.error({error:err}
                   , "error on attempt to publish builddown: " + docid);
        }
      }); // publish builddown
    }else{
      log.error({error:"no doc"}
               , "given value is not a mp-document");
    }
  } // if build
}); // on build


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
                        utils.cp(path.concat(["state"]), definition , cstr.ready, function(){
                          mem.publish("state", path, function(err){
                            if(!err){
                              log.info(ok
                                      , "sync definition and state of container: " + strpath);
                              if(_.isFunction(cb)){
                                cb(ok);
                              }
                            }
                          }); // publish state
                        });
                      });
                    }else{
                      ro = {error:err}
                      log.error(ro
                               , "error on attempt to set definition");
                      cb(ro)
                    }
                  });
                }else{
                  ro = {error:err}
                  log.error(ro
                           , "error on attempt to set container title");
                  cb(ro)
                }
              });
            }else{
              ro = {error:err}
              log.error(ro
                       , "error on attempt to set container description");
              cb(ro)
            }
          });
        }else{
          ro = {error:err}
          log.error(ro
                   , "error on attempt to set element");
          cb(ro)
        }
      });
    }else{
      ro = {error:err}
      log.error(ro
               , "error on attempt to set ctrl");
      cb(ro)
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
    var t = dc[i].Title || "__container title__"
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
              cb(path);
            }
          }); // id
        }); // tasks
      }); // definitions
    }); // exchange
  }); // meta
};
