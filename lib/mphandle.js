var _        = require("underscore")
  , bunyan   = require("bunyan")
  , ndata    = require('ndata')
  , deflt    = require("./default")
  , net      = require("./net")
  , request  = require("./request")
  , log      = bunyan.createLogger({name: deflt.app.name})
  , cstr     = deflt.ctrlStr
  , ok       = {ok:true}
  , mem      = ndata.createClient({port: deflt.mem.port})

/**
 * Führt die subscribes durch
 * @method ini
 * @param {Function} cb
 */
var ini = function(cb){
  mem.subscribe("get_mp", function(err){
    if(!err){
      log.info(ok
              , "mphandle.js subscribed to get_mp channel");
      mem.subscribe("rm_mp", function(err){
        if(!err){
          log.info(ok
                  , "mphandle.js subscribed to rm_mp channel");
          if( _.isFunction(cb)){
            cb(ok);
          }
        }else{
          log.error({error:err}
                   , "can not subscribe to rm_mp channel");
        }
      });
    }else{
      log.error({error:err}
               , "can not subscribe to get_mp channel");
    }
  });
}
exports.ini = ini;


mem.on('message', function(ch, val){
  if(ch == "get_mp"){
    getmp(val, function(err){
      if(!err){
        log.info(ok
                , "loading of mp triggered");
      }else{
        log.info({error:err}
                , "error on attempt to publish to load_mp channel");
      }
    });
  }

  if(ch == "rm_mp"){
    rmmp(val, function(err, path){
      if(!err){
        log.info(ok
                , "mp removed");
      }else{
        log.info({error:err}
                , "error on attempt to remove mp");
      }
    });
  }
});

var rmmp = function(id, cb){
  if(id && _.isString(id)){
    mem.publish("stop_all_container_obs", [id], function(err){
      if(!err){
        setTimeout(function(){
          mem.remove([id], true ,function(err, val){
            // got the old mp in var val
            // maybe write a restore options
            if(!err){
              if(_.isFunction(cb)){
                cb(false, []);
              }
            }else{
              if(_.isFunction(cb)){
                cb(err, []);
              }
            }
          });
        }, 2 * deflt.container.heartbeat)
      }else{
        if(_.isFunction(cb)){
          cb(err, []);
        }
      }
    });
  }else{
    if(_.isFunction(cb)){
      cb("wrong id", []);
    }
  }
}
exports.rmmp = rmmp;

var getmp = function(id, cb){
  if(id && _.isString(id)){
    var con = net.rddoc(id);
    request.exec(con, false, false, function(mpdoc){
      if(mpdoc._id && mpdoc.Mp){
        mem.publish("load_mp", mpdoc, function(err){
          if(!err){
            if(_.isFunction(cb)){
              cb(false, [mpdoc._id]);
            }
          }else{
            if(_.isFunction(cb)){
              cb(err, []);
            }
          }
        });
      }else{
        if(_.isFunction(cb)){
          cb("not a mpdoc", []);
        }
      }
    });
  }else{
    if(_.isFunction(cb)){
      cb("wrong id", []);
    }
  }
}
exports.getmp = getmp;