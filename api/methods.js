var _        = require("underscore")
  , bunyan   = require("bunyan")
  , clone    = require("clone")
  , broker   = require("sc-broker")
  , conf     = require("../lib/conf")
  , log      = bunyan.createLogger({name: conf.app.name + ".api.methods"})
  , ctrlstr  = conf.ctrlStr
  , ok       = {ok:true}
  , err;

var mem = broker.createClient({port: conf.mem.port});

/**
 * Listet alle geladenen mps
 * @param {Object} req Request-Objekt
 * @param {Function} cb call back
 */
var home = function(req, cb){
  mem.getAll(function(err, mps){
    if(!err){
      cb(null, _.keys(mps));
    }else{
      err = new Error("on attempt to mem.getAll()");
      log.error(err
               , " error on attempt to get all");

    }
  });
}
exports.home = home;

/**
 * dump aller mps
 * @param {Object} req Request-Objekt
 * @param {Function} cb call back
 */
var dump = function(req, cb){
  mem.getAll(function(err, all){
    if(!err){
      cb(null, all);
    }else{
      err = new Error("on attempt to mem.getAll()");
      log.error(err
               , " error on attempt to get all");
    }
  });
}
exports.dump = dump;

/**
 * restore mps
 * @param {Object} req Request-Objekt
 * @param {Function} cb call back
 */
var restore = function(req, cb){
  var b = req.body;
  if(_.isObject(req.body)){
    var ks = _.keys(b)
      , Nk = ks.length;
    for(var i=0; i < Nk; i++){
      (function(j){
        if(ks[j].split("-")[0] == "mpd"){
          var mpid = ks[j]
            , mpd  = b[mpid];
          mem.publish("stop_all_container_obs", [mpid], function(err){
            if(!err){
              mem.set([mpid], mpd, function(err){
                if(!err){
                  for(var l =0; l < mpd.meta.container.N; l++){
                    mem.publish("start_container_obs", [mpid, l], function(err){});
                  }
                  if(j == Nk -1 && _.isFunction(cb)){
                    cb(null, ok);
                  }
                }else{
                  log.error(err
                           , "error on attempt to restore");
                  if(_.isFunction(cb)){
                    cb(err);
                  }
                }
              }); // set
              };
          });
        }else{
          mem.set([ks[j]], b[ks[j]], function(err){
            if(!err){
              if(j == Nk -1 && _.isFunction(cb)){
                cb(null, ok);
              }
            }else{
              log.error(err
                     , "error on attempt to restore");
              if(_.isFunction(cb)){
                cb(err);
              }
            }
          }); // set
        }
      })(i)
    }
  }
}
exports.restore = restore;

/**
 * Funktion veranlasst laden und löschen der mp-
 * Dokumente.
 *
 * @param {Object} req Request-Objekt
 * @param {Function} cb call back
 */
var handle_mp = function(req, cb){
  if(req && _.isObject(req)
         && req.params
         && _.isObject(req.params)){

    var id    = req.params.id
      , rb    = req.body;
    if(rb && _.isString(rb)){
      if(rb == ctrlstr.load){
        log.trace(ok
                , "try to publish to get_mp channel");
        mem.publish("get_mp", id , function(err){
          if(!err){
            if(_.isFunction(cb)){
              cb(null, ok);
            }
            log.trace(ok
                    , " published to get_mp channel");
          }else{
            log.error(err
                     , " error on attempt to publish to get_mp channel");
            if(_.isFunction(cb)){
              cb(err);
            }
          }
        });
      }
      if(rb == ctrlstr.rm){
        log.trace(ok
                , "try to publish to rm_mp channel");
        mem.publish("rm_mp", id, function(err){
          if(!err){
            log.trace(ok
                    , " published to rm_mp channel");
            if(_.isFunction(cb)){
              cb(null, ok)
            }
          }else{
            log.error(err
                     , " error on attempt to publish to rm_mp channel");
            if(_.isFunction(cb)){
              cb(err)
            }
          }
        });
      }
    }else{ // string
      err = new Error("unvalid request body");
      log.error(err
               , "no request body");
      if(_.isFunction(cb)){
        cb(err);
      }
    }
  }else{
    err = new Error("unvalid request object");
    log.error(err
             , "no request param");
    if(_.isFunction(cb)){
      cb(err);
    }
  }
}
exports.handle_mp =  handle_mp;

/**
 * Funktion veranlasst laden und löschen der
 * CD (calibration documents).
 *
 * @param {Object} req Request-Objekt
 * @param {Function} cb call back
 */
var handle_cd = function(req, cb){
  if(req && _.isObject(req)
         && req.params
         && _.isObject(req.params)){

    var val = { id:   req.params.id
              , cdid: req.params.cdid}
      , rb  = req.body;
    if(rb && _.isString(rb)){
      if(rb == ctrlstr.load){
        log.trace(ok
                , "try to publish to get_cd channel");
        mem.publish("get_cd", val, function(err){
          if(!err){
            log.trace(ok
                    , "published to get_cd channel");
            if(_.isFunction(cb)){
              cb(null, ok)
            }
          }else{
            log.error(err
                     , "error on attempt to publish to get_cd channel");
            if(_.isFunction(cb)){
              cb(err)
            }
          }
        });
      };
      if(rb == ctrlstr.rm){
        log.trace(ok
                , "try to publish to get_cd channel");
        mem.publish("rm_cd", val, function(err){
          if(!err){
            log.trace(ok
                    , "published to rm_cd channel");
            if(_.isFunction(cb)){
              cb(err, ok);
            }
          }else{
            log.error(err
                     , "error on attempt to publish to rm_cd channel");
            if(_.isFunction(cb)){
              cb(err)
            }
          }
        });
      };
    }else{ // string
      var err = new Error("unvalid request body");
      log.error(err
               , "no request body");
      if(_.isFunction(cb)){
        cb(err);
      }
    }
  }else{
    var err = new Error("unvalid request object");
    log.error(err
             , "no request param");
    if(_.isFunction(cb)){
      cb(err);
    }
  }
}
exports.handle_cd = handle_cd;

/**
 * Funktion schreibt Daten in die
 * mem-Struktur und ruft callback damit auf.
 *
 * @param {Object} req Request-Objekt
 * @param {Function} cb call back
 */
var put = function(req, cb){
  get_path(req, function(err, path){
    if(!err){
      if(!_.isUndefined(req.body)){
        var strpath  = path.join(" ")
        log.trace(ok
                , "receice put request to path " + strpath);
        mem.set(path, req.body, function(err){
          if(!err){
            log.trace(ok
                    , "set value to path: " + strpath);
            if(_.isFunction(cb)){
              cb(null, ok);
            }
          }else{
            log.error(err
                     , "set value to path: " + strpath);
            if(_.isFunction(cb)){
              cb(err);
            }
          }
        });
      }else{
        err = new Error("unvalid request body");
        log.debug(err
                , "given path is not meaningful");
        if(_.isFunction(cb)){
          cb(err);
        }
      }
    }else{
      log.error(err
               , "given path is not meaningful");
      if(_.isFunction(cb)){
        cb(err);
      }
    }
  });
}
exports.put = put;

/**
 * Funktion ließt Daten aus der
 * mem-Struktur und ruft callback damit auf.
 * @param {Object} req Request-Objekt
 * @param {Function} cb call back
 */
var get = function(req, cb){
  var ro
  get_path(req, function(err, path){
    if(!err){
      log.trace(ok
              , "receice get request to path " + path.join(" "));
      mem.get(path, function(err, obj){
        if(err){
          log.error(ro
                   ,"error on get from mem");
          cb(err);
        }else{
          if(_.isUndefined(obj)){
            err = new Error("object is undefined");
            log.debug(err
                     ,"found nothing in the path");
            cb(err);
          }else{
            if(_.isObject(obj) || _.isArray(obj)){
              log.trace(ok
                      , "sent object back");
              cb(null, obj);
            }else{
              log.trace(ok
                      , "sent value back");
              cb(null, {result:obj});
            };
          }
        }
      }); // mem.get
    }else{
      log.error(err
               ,"error on get path");
      if(_.isFunction(cb)){
        cb(err);
      }
    }
  }); // get_path
}
exports.get = get;

/**
 * Funktion extrahiert den Pfad aus dem
 * req-Objekt und gibt ihn zurück.
 * @param {Object} req Request-Objekt
 * @param {Function} cb callback of the form cb(err, path)
 */
var get_path = function(req, cb){
  var path = [];

  if(req && _.isObject(req)
         && req.params
         && _.isObject(req.params)){
    var rp   = req.params
      , id   = rp.id
      , no   = rp.no
      , s    = rp.struct
      , l1   = rp.l1
      , l2   = rp.l2
      , l3   = rp.l3;

    if(!_.isEmpty(id)){
      path = ["" + id];
      if(!_.isEmpty(no)){
        path = path.concat(["" + no]);
        if(s){
          path = path.concat(s);
          if(l3 && l2 && l1){
            path =  path.concat(["" + l1, "" + l2, "" + l3]);
          }
          if(l2 && l1 && !l3){
            path =   path.concat(["" + l1, "" + l2]);
          }
          if(l1 && !l2 && !l3){
            path = path.concat(["" + l1]);
          }
        }
      }
      if(_.isFunction(cb)){
        cb(null, path);
      }
    }else{
      err = new Error("missing id");
      if(_.isFunction(cb)){
        cb(err);
      }
    }
  }else{
    err = new Error("unvalid request object");
    if(_.isFunction(cb)){
      cb(err);
    }
  }
}
exports.get_path = get_path;
