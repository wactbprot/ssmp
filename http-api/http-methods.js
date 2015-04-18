var  name    = "http-ssmp"
  , _        = require("underscore")
  , bunyan   = require("bunyan")
  , clone    = require("clone")
  , ndata    = require("ndata")
  , deflt    = require("../lib/default")
  , log      = bunyan.createLogger({name: name})
  , ctrlstr  = deflt.ctrlStr
  , ok       = {ok:true}

var mem = ndata.createClient({port: deflt.mem.port});

/**
 * Funktion veranlasst laden und löschen der mp-
 * Dokumente.
 *
 * @param {Object} req Request-Objekt
 * @param {Function} cb call back
 */
var handle_mp = function(req, cb){
  var id    = req.params.id
    , rb    = req.body;
  if(_.isString(rb)){
    // switch
    if(rb == ctrlstr.load){
      log.info(ok
              , "try to publish to get_mp channel");
      mem.publish("get_mp", id , function(err){
        if(!err){
          if(_.isFunction(cb)){
            cb(ok)
          }
          log.info(ok
                  , " published to get_mp channel");
        }else{
          var ro = {error:err};
          log.error(ro
                   , " error on attempt to publish to get_mp channel");
          if(_.isFunction(cb)){
            cb(ro)
          }
        }
      });
    }
    if(rb == ctrlstr.rm){
      log.info(ok
              , "try to publish to rm_mp channel");
      mem.publish("rm_mp", id , function(err){
        if(!err){
          if(_.isFunction(cb)){
            cb(ok)
          }
          log.info(ok
                  , " published to rm_mp channel");
        }else{
          var ro = {error:err};
          log.error(ro
                   , " error on attempt to publish to rm_mp channel");
          if(_.isFunction(cb)){
            cb(ro)
          }
        }
      });
    }
  };
}
exports.handle_mp =  handle_mp;

/**
 * Funktion veranlasst laden und löschen der
 * cd(calibration )-
 * Dokumente.
 *
 * @param {Object} req Request-Objekt
 * @param {Function} cb call back
 */
var handle_cd = function(req, cb){
  var val = { id:   req.params.id
            , cdid: req.params.cdid}
    , rb  = req.body;

  if(_.isString(rb)){
    // switch
    if(rb == ctrlstr.load){
      log.info(ok
              , "try to publish to get_cd channel");
      mem.publish("get_cd",val , function(err){
        if(!err){
          log.info(ok
                  , "published to get_cd channel");
          if(_.isFunction(cb)){
            cb(ok)
          }
        }else{
          var ro = {error:err};
          log.error(ro
                   , "error on attempt to publish to get_cd channel");
          if(_.isFunction(cb)){
            cb(ro)
          }

        }
      });
    };

    if(rb == ctrlstr.rm){
      log.info(ok
              , "try to publish to get_cd channel");
      mem.publish("rm_cd",val , function(err){
        if(!err){
          log.info(ok
                  , "published to rm_cd channel");
          if(_.isFunction(cb)){
            cb(ok);
          }
        }else{
          var ro = {error:err}
          log.error(ro
                   , "error on attempt to publish to rm_cd channel");
          if(_.isFunction(cb)){
            cb(ro)
          }
        }
      });
    };
  } // string
}
exports.handle_cd =  handle_cd;

/**
 * Funktion schreibt Daten in die
 * mem-Struktur und ruft callback damit auf.
 *
 * @param {Object} req Request-Objekt
 * @param {Function} cb call back
 */
var put = function(req, cb){
  var ro
  get_path(req, function(err, path){
    if(!err){
      var strpath  = path.join(" ")
      log.info(ok
              , "receice put request to path " + path.join(" "));
      mem.set(path, req.body, function(err){
        if(!err){
          ro = ok;
          log.info(ok
                  , "set value to path: " + strpath);
        }else{
          ro = {error:err}
        log.error(ro
                 , "set value to path: " + strpath);
        }
        if(_.isFunction(cb)){
          cb(ro);
        }
      });
    }else{
      ro  = {error:err}
      log.error(ro
               , "given path is not meaningful");
      if(_.isFunction(cb)){
        cb(ro);
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
      log.info(ok
              , "receice get request to path " + path.join(" "));
      mem.get(path, function(err, obj){
        if(err){
          ro = {error:err}
          log.error(ro
                   ,"error on get from mem");
        }else{
          if(_.isUndefined(obj)){
            ro = {error:"object is undefined"}
            log.error(ro
                 ,"found nothing in the path");
          }else{
            if(_.isObject(obj) || _.isArray(obj)){
              ro = obj;
              log.info(ok
                      , "sent object back");
            }else{
              ro  = {result:obj}
              log.info(ok
                    , "sent value back");
            };
          }
        }
        cb(ro)
      }); // mem.get
    }else{
      log.error({error:err}
               ,"error on get path");
      if(_.isFunction(cb)){
        cb({error:err});
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
        cb(false, path);
      }
    }else{
      if(_.isFunction(cb)){
        cb("missing id",[]);
      }
    }
  }else{
    if(_.isFunction(cb)){
      cb("unvalid request object",[]);
    }
  }
}
exports.get_path = get_path;
