var _        = require("underscore")
  , bunyan   = require("bunyan")
  , ndata    = require('ndata')
  , clone    = require('clone')
  , deflt    = require("./default")
  , worker   = require("./worker")
  , utils    = require("./utils")
  , log      = bunyan.createLogger({name: deflt.app.name})
  , cstr     = deflt.ctrlStr
  , ro       = {ok:true}
  , err
  , mem      = ndata.createClient({port: deflt.mem.port})
  , timer    = {};

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
                var all_values_executed = _.every(_.values(state[i]),function (k){
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

/**
 * Die Funktion ```run()```  erledigt folgende Aufgaben:
 * * wählt die richtige  ```worker```-Funktion aus und stellt den
 * * callback zur Verfügung
 * * RunIf und StopIf werden entschieden
 * * es werden die Laufzeitersetzungen vorgenommen
 * (Bsp.: der String für den MKS-Flow Kontroller)
 * @method run
 * @param {Array} path
 * @param {Number} s
 * @param {Number} p
 * @param {Object} task
 */
var run = function (path, s, p, task){
  var mpid    = path[0]
    , no      = path[1];
  if(_.isObject(task) && task.Action && _.isFunction (worker[task.Action])){
    var ok      = true
      , exec    = task.Action
      , cmdstr  = cstr.exec
      , tsknm   = task.TaskName;

    exchange_replace([mpid, "exchange"], task, ok, cmdstr, function (task, ok, cmdstr){
      run_if([mpid, "exchange"], task, ok, cmdstr, function (task, ok, cmdstr){
        stop_if([mpid, "exchange"], task, ok, cmdstr, function (task, ok, cmdstr){
          mem.publish("worker", exec, function (err){
            if(!err){
              if(ok){
                var delay = parseInt(p, 10) * deflt.system.par_delay_mult;
                setTimeout(function (){
                  log.info(ro
                          , "start " + tsknm
                          + " with a delay of "
                          + delay + "ms")
                  // -------------------------------------------------------
                  task.Path = path;
                  worker[exec](task, function (err, res){
                    if(err){
                      log.error(err
                               , "task " + tsknm
                               + " task execution failed")
                      mem.set([mpid, no, "state", s, p], cstr.error, function (err){
                        if(!err){
                          mem.publish("state", [mpid, no, "state", s, p], function (err){
                            if(err){
                              log.fatal(err
                                       , "unable to publish state event"
                                       + " in error branch");
                            }
                          }); // publish
                        }else{
                          log.fatal(err
                                   , "unable to set state"
                                   + " in error branch");
                        }
                      });
                    }else{ // return with error
                      if(res.end){
                        log.info(ro
                                ,"callback executed; "
                                + "no callback related state changes");
                      }

                      // depricated                      if(res.again){
                      // depricated                        mem.set( [mpid, no, "state", s, p], cstr.ready, function (){
                      // depricated                          mem.publish("state", [mpid, no, "state", s, p], function (err){
                      // depricated                            if(err){
                      // depricated                              log.error(err
                      // depricated                                       , "unable to publish state event");
                      // depricated                            }
                      // depricated                          }); // publish
                      // depricated                        }); // state set
                      // depricated                      } // return again

                      if(res.ok){
                        mem.set([mpid, no, "state", s, p], cmdstr, function (err){
                          if(!err){
                            mem.publish("state",  [mpid, no, "state", s, p], function (err){
                              if(err){
                                log.error(err
                                         , "unable to publish state event");
                              }
                            }); // publish
                          }else{
                            log.error(err
                                     , "unable to set state");
                          }
                        }); // set state
                      } // return ok
                    } // err else
                  }); // worker callback
                }, delay);
              }else{ // ok false == again
                mem.set([mpid, no, "state", s, p], cmdstr, function (err){
                  if(!err){
                    mem.publish("state", [mpid, no, "state", s, p], function (err){
                      if(err){
                        log.error(err
                                 , "unable to publish state event");
                      }
                    }); // publish
                  }else{
                    log.error(err
                             , "on set state");
                  }
                }); // set state
              }// worker[exec]
            }else{
              log.error(err
                       , "error on publishing exec: "
                       + exec);
            }
          }); // publish
        }); // runif
      }); // stopif
    }); // exchange
  }else{// task is obj
    mem.set([mpid, no, "state", s, p], cstr.error, function (){
      log.error(task
               , "task don't work (most likely unknown Action)")
    });
  }
}
exports.run = run;


/**
 * Frischt Task mit aktuelle exchange Werten auf
 * @method exchange_replace
 * @param {Array} path
 * @param {Object} task
 * @param {Boolean} ok
 * @param {String} cmdstr
 * @param {Function} cb
 */
var exchange_replace = function (path, task, ok, cmdstr, cb){

  // --- Runtime data exchange
  if(task.FromExchange && _.isObject(task.FromExchange)){

    var tFE    = clone(task.FromExchange)
      , tokens = _.keys(tFE)
      , pathes = _.values(tFE);

    var N = tokens.length;
    for( var l = 0; l < N; l++){
      var path_l = pathes[l].split(".");

      mem.get(path.concat(path_l)
             , function (m, n){
                 return function (err, value){
                   if(!err){
                     if(!_.isUndefined(value)){
                       // der key in task.FromExchange
                       // muss erhalten bleiben;
                       // deshalb: raus:
                       delete task.FromExchange;

                       // ersetzen
                       task =  utils.replace_in_with(task, tokens[m] , value );
                       // wieder rein
                       task.FromExchange = tFE;
                     }else{
                       ok = false;
					             log.warn({warn: "undefined value"}
                               , "value for path " + pathes[m] + "is undefined");
					           }
                   }else{
                     log.error(err
                              , "can not read exchange at " + pathes[m]);
                   }
                   if(m == n - 1){
                     cb(task, ok, cmdstr);

                   }
                 }
               }(l, N)); // get exchange
    } // for
  }else{ // FromExchange object
    cb(task, ok, cmdstr);
  }
}
exports.exchange_replace = exchange_replace;

/**
 * Entscheidet ob Task abgearbeitet ist
 * @method stop_if
 * @param {Array} path
 * @param {Object} task
 * @param {Boolean} ok
 * @param {String} cmdstr
 * @param {Function} cb
 */
var stop_if = function (path, task, ok, cmdstr, cb){
  var tsknm = task.TaskName

  // --- StopIf
  if(task.StopIf){
    var path_s = task.StopIf.split(".");

    mem.get(path.concat(path_s), function (err, value){
      if(!err){
        if(value ==  true || value == "true"){
          ok     = false;
          cmdstr = cstr.exec;
        }else{
          ok     = true;
          cmdstr = cstr.ready;
        }
      }else{
        log.info(err
                , "can not read exchange at " + task.StopIf);
      }
      cb(task, ok, cmdstr);
    }); // get stop if state
  }else{ // StopIf
    cb(task, ok, cmdstr);
  }
}
exports.stop_if = stop_if;

/**
 * Entscheidet ob Task gestartet wird
 * @method run_if
 * @param {Array} path
 * @param {Object} task
 * @param {Boolean} ok
 * @param {String} cmdstr
 * @param {Function} cb
 */
var run_if = function (path, task, ok, cmdstr, cb){
  var tsknm = task.TaskName
  // --- RunIf
  if(task.RunIf){
    var path_r = task.RunIf.split(".");
    mem.get(path.concat(path_r), function (err, value){
      if(!err){
        if(value ==  true || value == "true"){
          ok     = true;
	        cmdstr = cstr.exec;
        }else{
          ok     = false;
	        cmdstr = cstr.ready;
        }
      }else{
        log.error(err
                 , "can not read exchange at " + task.RunIf);
      }
      cb(task, ok, cmdstr);
    }); // get run if state
  }else{ // RunIf
    cb(task, ok, cmdstr);
  }
}
exports.run_if = run_if;
