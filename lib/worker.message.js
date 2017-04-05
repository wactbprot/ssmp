/**
 * @module work.message
 */
var _        = require("underscore")
  , bunyan   = require("bunyan")
  , conf     = require("./conf")
  , utils    = require("./utils")
  , broker   = require("sc-broker")
  , log      = bunyan.createLogger({name: conf.app.name + ".worker.message",
                                    streams: conf.log.streams
                                   })
  , mem      = broker.createClient({port: conf.mem.port})
  , ro       = {ok: true}
  , err;


/**
 * ```message()```  writes messages to the path
 * [mpid, no, message]. a timer is started wich
 * ends the funtion when message is "" again
 *
 * @method message
 * @param {Object} task Task-Objekt
 * @param {Function} cb Callback Funktion
 */
module.exports = function(task, cb){
  var path = task.Path
    , mpid    = path[0]
    , no      = path[1];

  log.trace(ro,
            "call function message");
  mem.set([mpid, no, "message"], task.Message, function(err){
    if(!err){
      var iid = setInterval(function (){
                  mem.get([mpid, no, "message"], function(err, msg){
                    if(!err){
                      log.trace(ro
                               , "message lookup:" + msg);

                      if(msg == "ok"){
                        log.trace(ro
                                 , "message reset; clear interval");
                        clearInterval(iid);
                        if(_.isFunction (cb)){
                          cb(null, ro);
                        }
                      }
                    }else{
                      log.error(err
                               , "error on attempt to read from message channel");
                    }
                  });
                }, 500);
    }
  });
};
