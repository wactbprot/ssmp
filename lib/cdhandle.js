var  name    = "http-ssmp"
  , _        = require("underscore")
  , bunyan   = require("bunyan")
  , clone    = require("clone")
  , ndata    = require("ndata")
  , deflt    = require("./default")
  , net      = require("./net")
  , request  = require("./request")
  , log      = bunyan.createLogger({name: name})
  , ctrlstr  = deflt.ctrlStr
  , ok       = {ok:true}

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
            cb(ok);
          }
        }
      });
    }
  });
}
exports.ini = ini;

mem.on('message', function(ch, val){
  var mpid   = val.id
    , cdid   = val.cdid

  if(ch == "get_cd"){
    getcd(mpid, cdid, function(err, path){
      if(!err){
        log.info({ok:true}
                , "doc with id: " + cdid + "written");
      }else{
        log.error({error:err}
                 , "on attempt to write doc");

      }
    });
  }

  if(ch == "rm_cd"){
    rmcd(mpid, cdid, function(err, path){
      if(!err){
        log.info({ok:true}
                , "doc with id: " + cdid + "removed");
      }else{
        log.error({error:err}
                 , "on attempt to remove doc");
      }
    })
  }
});

var rmcd = function(mpid, cdid, cb){
  if(mpid && _.isString(mpid) && mpid && _.isString(mpid)){
    mem.remove([mpid, "id", cdid], function(err){
      if(!err){
        mem.publish("update_cd", [mpid, "id", cdid], function(err){
          if(!err){
            if(_.isFunction(cb)){
              cb(false, [mpid]);
            }
          }else{
            if(_.isFunction(cb)){
              cb(err , []);
            }
          }
        }); // publish
      }else{
        if(_.isFunction(cb)){
          cb(err , [mpid]);
        }
      }
    }); // remove
  }else{
    if(_.isFunction(cb)){
      cb("wrong mpid or cdid", []);
    }
  }
}
exports.rmcd = rmcd;

var getcd = function(mpid, cdid, cb){
  if(mpid && _.isString(mpid) && mpid && _.isString(mpid)){
    var con = net.docinfo(cdid);
    request.exec(con, false, false, function(res){
      if(res.error){
      if(_.isFunction(cb)){
        cb(res.error, []);
      }
    }else{
      mem.set([mpid, "id", cdid], res, function(err){
        if(!err){
          mem.publish("update_cd", [mpid, "id", cdid], function(err){
            if(!err){
              if(_.isFunction(cb)){
                cb(false, [mpid]);
              }
            }else{
              if(_.isFunction(cb)){
                cb(err , [mpid]);
              }
            }
          }); // publish
        }else{
          if(_.isFunction(cb)){
            cb(err, [mpid]);
          }
        }
      }); // set
    }
  }); // request
  }else{
    if(_.isFunction(cb)){
      cb("wrong mpid or cdid", []);
    }
  }
}
exports.getcd = getcd;