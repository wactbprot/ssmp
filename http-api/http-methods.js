var  name    = "http-ssmp"
  , _        = require("underscore")
  , bunyan   = require("bunyan")
  , clone    = require("clone")
  , ndata    = require("ndata")
  , deflt    = require("../lib/default")
  , log      = bunyan.createLogger({name: name})
  , ctrlstr  = deflt.ctrlStr
  , ok       = {ok:true}

var mem = ndata.createClient({port: 9000});

/**
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



var put = function(req, cb){
  var ro
    , path     = get_path(req)
    , strpath  = path.join(" ")

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
    cb(ro);
  });
}
exports.put = put;

var get = function(req, cb){
  var ro
    , path = get_path(req);

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
  })
}
exports.get = get;

var get_path = function(req){
  var path = [];

  if(req.params){
    var id   = req.params.id
      , no   = req.params.no
      , s    = req.params.struct
      , l1   = req.params.l1
      , l2   = req.params.l2
      , l3   = req.params.l3;

    if(id && no){
      path = [id, no];
      if(s){
        path = path.concat(s);
        if(l3 && l2 && l1){
          path = path.concat([l1, l2, l3]);
        }
        if(l2 && l1 && !l3){
          path = path.concat([l1, l2]);
        }
        if(l1 && !l2 && !l3){
          path = path.concat([l1]);
        }
      }
    }
  }
  return path;
}
exports.get_path = get_path;
