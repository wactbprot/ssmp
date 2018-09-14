var _        = require("underscore")
  , bunyan   = require("bunyan")
  , broker   = require("sc-broker")
  , conf     = require("./conf")
  , log      = bunyan.createLogger({name: conf.app.name + ".utils.writeToId",
                                    streams: conf.log.streams
                                   })
  , mem      = broker.createClient({port: conf.mem.port})
  , ok       = {ok: true}
  , err;

module.exports = function(task, data, cb){
  var path = task.Path
      , mpid = path[0]
      , N = data.ids.length ;
      if(N > 0){
        for (var i=0; i < N; i++ ) {
         (function(j){
            mem.publish("get_cd", {id:mpid, cdid: data.ids[j]}, function(err){
             if(!err){
            log.trace(ok, "published to get_cd channel");
            if(j == N-1 & _.isFunction(cb)){
            cb(null, ok)
          }
         }else{
          log.error(err, "error on attempt to publish to get_cd channel");
          if(_.isFunction(cb)){
             cb(err)
            }
          }
       });
      })(i)
      }
    } else {
      if(_.isFunction(cb)){
        cb(null, ok)
      }
    }
  } 