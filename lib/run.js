var _        = require("underscore")
  , bunyan   = require("bunyan")
  , logStrm  = require("bunyan-couchdb-stream")
  , ndata    = require('ndata')
  , clone    = require('clone')
  , deflt    = require("./default")
  , worker   = require("./worker")
  , utils    = require("./utils")
  , log = bunyan.createLogger({name: deflt.app.name + ".run",
                               streams: [
                                 {
                                   stream: new logStrm(utils.logurl),
                                   level: 'debug',
                                   type: 'raw'
                                 },{
                                   level: 'info',
                                   stream: process.stdout
                                 }
                               ]
                              })

  , cstr     = deflt.ctrlStr
  , ro       = {ok:true}
  , err
  , mem      = ndata.createClient({port: deflt.mem.port})
  , timer    = {};

var exchange_replace =  require("./run.exchangeReplace")
  , run_if           =  require("./run.runIf")
  , stop_if          =  require("./run.stopIf")
  , run              =  require("./run.run")

/**
 * Subscriptions
 * @method ini
 * @param {Function} cb
 */
var ini = function (cb){
  mem.subscribe(cstr.run, function (err){
    if(!err){
      log.info(ro
              , "run.js subscribed to run channel");
      mem.subscribe(cstr.exec, function (err){
        if(!err){
          log.info(ro
                  , "run.js subscribed to executed channel");

          mem.subscribe(cstr.stop, function (err){
            if(!err){
              log.info(ro
                      , "run.js subscribed to stop channel");
              if( _.isFunction (cb)){
                cb(null, ro);
              }
            }else{
              log.error(err
                      , "error on stop subscription in run.js");
            }
          }); // stop
        }else{
          log.error(err
                  , "error on executed subscription in run.js");
        }
      }); // exec
    }else{
      log.error(err
               , "error on run subscription in jun.js");
    }
  }); // run
}
exports.ini = ini;

mem.on('message', function (ch, path){
  var endseq  = false
    , mpid    = path[0]
    , no      = path[1]

  if(ch == "stop"){
    if(timer[mpid] && timer[mpid][no]){
      if(timer[mpid][no]){
        log.info(ro
                , "receice stop event, clear intervall timer id");
        clearInterval(timer[mpid][no])
        timer[mpid][no] = 0;
      }
    }
  }


  if(ch == "executed"){
    if(timer[mpid] && timer[mpid][no]){
      if(timer[mpid][no]){
        log.info(ro
                , "receice executed event, clear intervall timer id");
        clearInterval(timer[mpid][no])
        timer[mpid][no] = 0;
      }
    }
  }

  if(ch == "run"){
    log.info(ro
            , "receice run event");
    if(!timer[mpid]){
      log.info(ro
              , "prepair new timer for mp: "
              + mpid);
      timer[mpid] = {};
    }
    if(!timer[mpid][no]){
      log.info(ro
              , "prepair new timer for mp container : " + no);

      timer[mpid][no] = setInterval(
        function (){
          mem.get([mpid, no, "state"], function (err, state){
            if(!err){
              for(var i in state){
                var some_values_ready = _.some(_.values(state[i])
                                              , function (k){
                                                  return k == cstr.ready;
                                                });

                if(some_values_ready){
                  for(var j in state[i]){
                    if(state[i][j] == cstr.ready){
                      mem.set([mpid, no, "state", i, j], cstr.work
                             , function (s, p){
                                 return function (err){
                                   mem.publish("state", [mpid, no, "state", s, p], function (err){
                                     if(!err){
                                       mem.get([mpid, no, "recipe",s, p]
                                              , function (err, task){
                                                  if(!err){
                                                    //------------------
                                                    run(path, s, p, task);
                                                    //------------------
                                                  }else{
                                                    log.error(err
                                                             , "can not read recipe on position "
                                                             + [mpid, no, "recipe",s, p].join(" "));
                                                  }
                                                });
                                     }else{
                                       log.error(err
                                                , "can not set state at "
                                                + [mpid, no, "state", i, j].join(" "));
                                     }
                                   }); // publisch state
                                 }}(i, j)); // set work closure
                    }// if ready
                  }  // j
                } // contains ready

                // solange bei i bleiben (break)
                // bis nicht alle ausgeführt sind
                var all_values_executed = _.every(_.values(state[i]), function (k){
                                            return k == cstr.exec;
                                          });
                if(! all_values_executed){
                  break;
                }
              } // i
            }else{
              log.error(err
                       , "can not read state");
            }
          }); // state
        }, deflt.container.heartbeat);
    }else{
      log.warn({warn: "running"}
              , "container is already running");
    }
  }
});

exports.exchange_replace = exchange_replace;
exports.run_if           = run_if;
exports.stop_if          = stop_if;
exports.run              = run;