var _        = require("underscore")
  , bunyan   = require("bunyan")
  , ndata    = require('ndata')
  , clone    = require('clone')
  , deflt    = require("./default")
  , worker   = require("./worker")
  , utils    = require("./utils")
  , log      = bunyan.createLogger({name: deflt.appname})
  , cstr     = deflt.ctrlStr
  , ok       = {ok:true}
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
      log.info(ok
              , "run.js subscribed to run channel");
      mem.subscribe(cstr.exec, function (err){
        if(!err){
          log.info(ok
                  , "run.js subscribed to executed channel");

          mem.subscribe(cstr.stop, function (err){
            if(!err){
              log.info(ok
                      , "run.js subscribed to stop channel");
              if( _.isFunction (cb)){
                cb(ok);
              }
            }else{
              log.info({error:err}
                      , "error on stop subscription in run.js");
            }
          }); // stop
        }else{
          log.info({error:err}
                  , "error on executed subscription in run.js");
        }
      }); // exec
    }else{
      log.info({error:err}
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
        log.info(ok
                , "receice stop event, clear intervall timer id");
        clearInterval(timer[mpid][no])
        timer[mpid][no] = 0;
      }
    }
  }


  if(ch == "executed"){
    if(timer[mpid] && timer[mpid][no]){
      if(timer[mpid][no]){
        log.info(ok
                , "receice executed event, clear intervall timer id");
        clearInterval(timer[mpid][no])
        timer[mpid][no] = 0;
      }
    }
  }

  if(ch == "run"){
    log.info(ok
            , "receice run event, start intervall timer");
    if(!timer[mpid]){
      timer[mpid] = {};
    }
    if(!timer[mpid][no]){
      timer[mpid][no] = setInterval(function (){
                          mem.get([mpid, no, "state"], function (err, state){
                            if(!err){
                              for(var i in state){

                                var some_values_ready = _.some(_.values(state[i]),function (k){
                                                          return k == cstr.ready;
                                                        });

                                if(some_values_ready){
                                  for(var j in state[i]){
                                    if(state[i][j] == cstr.ready){
                                      var path_s = [mpid, no, "state", i, j];

                                      mem.set(path_s, cstr.work, function (s,p){
                                                                   return function (err){
                                                                     mem.publish("state", [mpid, no, "state",s,p], function (err){
                                                                       if(!err){
                                                                         endseq = true;
                                                                         var path_r = [mpid, no, "recipe",s,p];
                                                                         mem.get(path_r, function (err, task){
                                                                           if(!err){
                                                                             //------------------
                                                                             run(path, s, p, task);
                                                                             //------------------
                                                                           }else{
                                                                             log.err({error: err}
                                                                                    , "can not read recipe on position " + path_r.join(" "));
                                                                           }
                                                                         });
                                                                       }else{
                                                                         log.err({error:err}
                                                                                , "can not set state at " + path_s.join(" "));
                                                                       }
                                                                     }); // publisch state
                                                                   }}(i,j)); // set work closure
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
                              log.error({error: err}
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
    , no      = path[1]
    , path_e  = [mpid, "exchange"]
    , path_s  = [mpid, no, "state", s, p];

  if(_.isObject(task) && task.Action && _.isFunction (worker[task.Action])){
    var ok      = true
      , ro      = {ok:ok}
      , exec    = task.Action
      , cmdstr  = cstr.exec
      , tsknm   = task.TaskName

    task_exchange(path_e, task, ok, cmdstr, function (ok, task, cmdstr){
      task_stop_if(path_e, task, ok, cmdstr, function (ok, task, cmdstr){
        task_run_if(path_e, task, ok, cmdstr, function (ok, task, cmdstr){
          mem.publish("worker", exec, function (err){
            if(!err){
              log.info(ro
                      ,"worker event published");
              if(ok){
                var delay = parseInt(p, 10) * deflt.system.par_delay_mult;
                setTimeout(function (){
                  log.info(ro
                          , "start " + tsknm + " with a delay of " + delay + "ms")
                  // -------------------------------------------------------
                  task.Path = path;
                  worker[exec](task, function (res){

                    if(res.end){
                      log.info({ok:true}
                              ,"callback executed; no callback related state changes");
                    } // return again

                    if(res.again){
                      mem.set( path_s, cstr.ready, function (){
                        mem.publish("state", path_s, function (err){
                          if(!err){
                            log.info(ro
                                    ,"state event published");
                          }else{
                            log.error({error: err}
                                     , "unable to publish state event");
                          }
                        }); // publish
                      }); // state set
                    } // return again

                    if(res.ok){
                      mem.set(path_s, cmdstr, function (){
                        mem.publish("state",  path_s, function (err){
                          if(!err){
                            log.info(ro
                                    ,"state event published");
                          }else{
                            log.error({error: err}
                                     , "unable to publish state event");
                          }
                        }); // publish
                      })
                    } // return ok

                    if(res.error){
                      mem.set(path_s, cstr.error, function (){
                        mem.publish("state",  path_s, function (err){
                          if(!err){
                            log.info(ro
                                    ,"state event published");
                          }else{
                            log.error({error: err}
                                     , "unable to publish state event");
                          }
                        }); // publish
                        log.error(res
                                 , "task " + tsknm + " task execution failed")
                      });
                    } // return with error
                  });
                  // -------------------------------------------------------
                }, delay);
              }else{

                mem.set(path_s, cmdstr, function (err){
                  if(!err){
                    log.info(ro
                            , "set " + path_s.join(".") + " to: " + cmdstr);
                    mem.publish("state", path_s, function (err){
                      if(!err){
                        log.info(ro
                                ,"state event published");
                      }else{
                        log.error({error: err}
                                 , "unable to publish state event");
                      }
                    }); // publish
                  }else{
                    log.error({error: err}
                             , "on set state");
                  }
                });
              }// worker[exec]
            }else{
              log.error({error:err}
                       , "error on publishing exec: " + exec)
            }
          }); // publish
        }); // runif
      }); // stopif
    }); // exchange
  }else{// task is obj
    mem.set(path_s, cstr.error, function (){
      log.error(task
               , "task don't work (most likely unknown Action)")
    });
  }
}



/**
 * Frischt Task mit aktuelle exchange Werten auf
 * @method task_exchange
 * @param {Array} path
 * @param {Object} task
 * @param {Boolean} ok
 * @param {String} cmdstr
 * @param {Function} cb
 */
var task_exchange = function (path, task, ok, cmdstr, cb){

  // --- Runtime data exchange
  if(task.FromExchange && _.isObject(task.FromExchange)){

    var tFE     = clone(task.FromExchange)
      , tokens = _.keys(tFE)
      , pathes = _.values(tFE);

    var N = tokens.length;
    for( var l = 0; l < N; l++){
      var path_l = pathes[l].split(".");
      mem.get(path.concat(path_l), function (m,n){
                                     return function (err, value){
                                       if(!err){
                                         if(value){
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
                                         }
                                       }else{
                                         log.info({error: err}
                                                 , "can not read exchange at " + pathes[m]);
                                       }
                                       if(m == n - 1){
                                         cb(ok, task, cmdstr);

                                       }
                                     }
                                   }(l, N)); // get exchange
    } // for
  }else{ // FromExchange object
    cb(ok, task, cmdstr);
  }
}

/**
 * Entscheidet ob Task abgearbeitet ist
 * @method task_stop_if
 * @param {Array} path
 * @param {Object} task
 * @param {Boolean} ok
 * @param {String} cmdstr
 * @param {Function} cb
 */
var task_stop_if = function (path, task, ok, cmdstr, cb){
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
        log.info({error: err}
                , "can not read exchange at " + task.StopIf);
      }
      cb(ok, task, cmdstr);
    }); // get stop if state
  }else{ // StopIf
    cb(ok, task, cmdstr);
  }
}

/**
 * Entscheidet ob Task gestartet wird
 * @method task_run_if
 * @param {Array} path
 * @param {Object} task
 * @param {Boolean} ok
 * @param {String} cmdstr
 * @param {Function} cb
 */
var task_run_if = function (path, task, ok, cmdstr, cb){
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
        log.error({error: err}
                 , "can not read exchange at " + task.RunIf);
      }
      cb(ok, task, cmdstr);
    }); // get run if state
  }else{// RunIf
    cb(ok, task, cmdstr);
  }
}