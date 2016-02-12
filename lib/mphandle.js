/**
 * Handles everything related to measurement program (mp) definitions
 *
 * @module mphandle
 */

var _        = require("underscore")
  , bunyan   = require("bunyan")
  , logStrm  = require("bunyan-couchdb-stream")
  , broker   = require("sc-broker")
  , conf     = require("./conf")
  , net      = require("./net")
  , request  = require("./request")
  , utils    = require("./utils")
  , ok       = {ok:true}, err
  , log      = bunyan.createLogger({name: conf.app.name + ".mphandle",
                                    streams: conf.log.streams
                                   })
  , mem      = broker.createClient({port: conf.mem.port});

/**
 * Führt die subscribes durch
 * @method ini
 * @param {Function} cb
 */
var ini = function(cb){
  mem.subscribe("get_mp", function(err){
    if(!err){
      log.trace(ok
              , "mphandle.js subscribed to get_mp channel");
      mem.subscribe("rm_mp", function(err){
        if(!err){
          log.trace(ok
                  , "mphandle.js subscribed to rm_mp channel");
          if( _.isFunction(cb)){
            cb(null, ok);
          }
        }else{
          log.error(err
                   , "can not subscribe to rm_mp channel");
        }
      });
    }else{
      log.error(err
               , "can not subscribe to get_mp channel");
    }
  });
}
exports.ini = ini;


mem.on('message', function(ch, val){
  if(ch == "get_mp"){
    getmp(val, function(err){
      if(!err){
        log.trace(ok
                 , "loading of mp triggered");
      }else{
        log.error(err
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
        log.error(err
                , "error on attempt to remove mp");
      }
    });
  }
});

var rmmp = function(id, cb){
  mem.get(["defaults"], function(err, defaults){

    if(id && _.isString(id)){
      mem.publish("stop_all_container_obs", [id], function(err){
        if(!err){
          setTimeout(function(){
            mem.remove([id], true, function(err, val){
              // got the old mp in var val
              // maybe write a restore options
              if(!err){
                if(_.isFunction(cb)){
                  cb(null, []);
                }
              }else{
                if(_.isFunction(cb)){
                  cb(err);
                }
              }
            });
          }, 2 * defaults.container.heartbeat)
        }else{
          if(_.isFunction(cb)){
            cb(err);
        }
        }
      });
    }else{
      if(_.isFunction(cb)){
        err = new Error("wrong id");
        cb(err);
      }
    }
  }); // get defaults
}
exports.rmmp = rmmp;

var getmp = function(id, cb){
  if(id && _.isString(id)){
    net.rddoc(id, function(err, con){
      request.exec(con, false, false, function(err, mpdoc){
        if(!err){
          if(mpdoc._id && mpdoc.Mp){
            mem.publish("load_mp", mpdoc, function(err){
              if(!err){
                if(_.isFunction(cb)){
                  cb(null, [mpdoc._id]);
                }
              }else{
                if(_.isFunction(cb)){
                  cb(err);
                }
              }
            });
          }else{
            if(_.isFunction(cb)){
              err = new Error("not a mpdoc");
              cb(err);
            }
          }
        }else{
          if(_.isFunction(cb)){
            cb(err);
          }
        }
      });
    }); // net con
  }else{
    if(_.isFunction(cb)){
      err = new Error("wrong id");
      cb(err);
    }
  }
}
exports.getmp = getmp;