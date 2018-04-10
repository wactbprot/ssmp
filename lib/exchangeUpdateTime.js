/**
 * exchangeUpdateTime updates a time stamp at mpid.exchanche.update_time
 *
 * @module exchangeUpdateTime
 */
var _        = require("underscore")
  , bunyan   = require("bunyan")
  , clone    = require("clone")
  , broker   = require("sc-broker")
  , utils    = require("./utils")
  , conf     = require("./conf")
  , ok       = {ok:true}, err
  , cstr     = conf.ctrlStr
  , timerId  = {}
  , log      = bunyan.createLogger({name: conf.app.name + ".exchangeUpdateTime",
                                    streams: conf.log.streams
                                   })
  , mem      = broker.createClient({port: conf.mem.port});

/**
 * subscribs to all needed channels
 * @method ini
 * @param {Function} cb
 */
var ini = function (cb){
  mem.subscribe("exchange", function (err){
    if(!err){
      log.trace(ok
              , "exchangeUpdateTime.js subscribed to exchange channel");

      if( _.isFunction (cb)){
        cb(null, ok);
      }
    }
  });
}
exports.ini = ini;

mem.on('message',function (ch, path){
  var mpid = path[0];
   mem.get([mpid, "exchange","start_time"], function(err, res){
        var ct =((new Date()).getTime() - res.Value)/60000
          , val = {Value: Math.round(ct*1000)/1000,
                   Unit:"min"};
    mem.set([mpid, "exchange","update_time"], val, function (err){
      if(!err){
        log.trace(ok
              , "exchange access, time updated");
      }
    });
  });
});
