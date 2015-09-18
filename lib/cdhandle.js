var  _        = require("underscore")
  , bunyan   = require("bunyan")
  , logStrm  = require("bunyan-couchdb-stream")
  , clone    = require("clone")
  , ndata    = require("ndata")
  , deflt    = require("./default")
  , net      = require("./net")
  , request  = require("./request")
  , utils    = require("./utils")
  , log = bunyan.createLogger({name: deflt.app.name + ".cdhandle",
                               streams: utils.log_streams
                              })
  , ctrlstr  = deflt.ctrlStr
  , ok       = {ok:true}
  , err;

var mem = ndata.createClient({port: deflt.mem.port});

/**
 * Führt subscribes aus
 * @method ini
 * @param {Function} cb
 */
var ini = function(cb){
  mem.subscribe("get_cd", function(err){
    if(!err){
      log.info(ok
              , "cdhandle.js subscribed to get_cd channel");
      mem.subscribe("rm_cd", function(err){
        if(!err){
          log.info(ok
                  , "cdhandle.js subscribed to rm_cd channel");
          if( _.isFunction(cb)){
            cb(null, ok);
          }
        }else{
          cb(err);
        }
      });
    }else{
      cb(err);
    }
  });
}
exports.ini = ini;

mem.on('message', function(ch, val){
  var mpid   = val.id
    , cdid   = val.cdid

  if(ch == "get_cd"){
    get_cd(mpid, cdid, function(err, path){
      if(!err){
        log.info(ok
                , "doc written to path" + path.join("."));
      }else{
        log.error(err
                 , "on attempt to write doc");
      }
    });
  }
  if(ch == "rm_cd"){
    rm_cd(mpid, cdid, function(err, path){
      if(!err){
        log.info(ok
                , "doc removed from path" + path.join("."));
      }else{
        log.error(err
                 , "on attempt to remove doc");
      }
    });
  }
});

var rm_cd = function(mpid, cdid, cb){
  if(mpid && _.isString(mpid) && mpid && _.isString(mpid)){
    mem.remove([mpid, "id", cdid], function(err){
      if(!err){
        mem.publish("update_cd", [mpid, "id", cdid], function(err){
          if(!err){
            if(_.isFunction(cb)){
              cb(null, [mpid, "id", cdid]);
            }
          }else{
            if(_.isFunction(cb)){
              cb(err);
            }
          }
        }); // publish
      }else{
        if(_.isFunction(cb)){
          cb(err);
        }
      }
    }); // remove
  }else{
    if(_.isFunction(cb)){
      err = new Error("wrong mpid or cdid");
      cb(err);
    }
  }
}
exports.rm_cd = rm_cd;

var get_cd = function(mpid, cdid, cb){
  if(mpid && _.isString(mpid) && mpid && _.isString(mpid)){
    var con = net.docinfo(cdid);
    request.exec(con, false, false, function(err, res){
      if(err){
        if(_.isFunction(cb)){
          cb(err);
        }
      }else{
        mem.set([mpid, "id", cdid], res, function(err){
          if(!err){
            mem.publish("update_cd", [mpid, "id", cdid], function(err){
              if(!err){
                if(_.isFunction(cb)){
                  cb(null, [mpid, "id", cdid]);
                }
              }else{
                if(_.isFunction(cb)){
                  cb(err);
                }
              }
            }); // publish
          }else{
            if(_.isFunction(cb)){
              cb(err);
            }
          }
        }); // set
      }
    }); // request
  }else{
    if(_.isFunction(cb)){
      err = new Error("wrong mpid or cdid");
      cb(err);
    }
  }
}
exports.get_cd = get_cd;