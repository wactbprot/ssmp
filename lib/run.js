var _        = require("underscore")
  , bunyan   = require("bunyan")
  , ndata    = require('ndata')
  , deflt    = require("./default")
  , worker   = require("./worker")
  , utils    = require("./utils")
  , log      = bunyan.createLogger({name: deflt.appname})
  , cstr     = deflt.ctrlStr
  , ok       = {ok:true}
  , mem      = ndata.createClient({port: 9000})
  , timer    = {};

mem.subscribe(cstr.run, function(err){
  if(!err){
    log.info(ok
            , "run.js subscribed to run channel");
  }else{
    log.info({error:err}
            , "error on run subscription in jun.js");
  }
})
mem.subscribe(cstr.exec, function(err){
  if(!err){
    log.info(ok
            , "run.js subscribed to executed channel");
  }else{
    log.info({error:err}
            , "error on executed subscription in run.js");
  }
})

mem.on('message', function(ch, path){
  var strpath = path.join(" ")
    , endseq  = false;

  if(ch == "executed"){
    if(timer[path]){
      log.info(ok
              , "receice executed event, clear intervall timer id");
      clearInterval(timer[path])
      timer[path] = 0;
    }
  }

  if(ch == "run"){
    log.info(ok
            , "receice run event, start intervall timer");
    timer[path] = setInterval(function(){
                    mem.get(path.concat(["state"]), function(err, state){
                      if(!err){
                        for(var i in state){

                          var some_values_ready = _.some(_.values(state[i]),function(k){
                                                    return k == cstr.ready;
                                                  });

                          if(some_values_ready){
                            for(var j in state[i]){
                              if(state[i][j] == cstr.ready){
                                var path_s = path.concat(["state",i,j]);

                                mem.set(path_s, cstr.work, function(s,p){
                                                             return function(err){
                                                               mem.publish("state", path.concat(["state",s,p]), function(err){
                                                                 if(!err){
                                                                   endseq = true;
                                                                   var path_r = path.concat(["recipe",s,p]);
                                                                   mem.get(path_r, function(err, task){
                                                                     if(!err){
                                                                       //------------------
                                                                       run(path, s, p, task);
                                                                       //------------------
                                                                     }else{
                                                                       log.info({error: err}
                                                                               , "can not read recipe on position "
                                                                               + path_r.join(" "));
                                                                     }
                                                                   });
                                                                 }else{
                                                                   log.err({error:err}
                                                                          , "can not set state at "
                                                                          + path_s.join(" "));
                                                                 }
                                                               }); // publisch state
                                                             }}(i,j)); // set work closure
                              }// if ready
                            }  // j
                          } // contains ready

                          // solange bei i bleiben (break)
                          // bis nicht alle ausgeführt sind
                          var all_values_executed = _.every(_.values(state[i]),function(k){
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
  }
});

/**
 *  * --*-- run --*--
 * Die Funktion ```run()```  erledigt folgende Aufgaben:
 *
 * * wählt die richtige  ```worker```-Funktion aus und stellt den
 *    callback zur Verfügung
 * * RunIf und StopIf werden entschieden
 * * es werden die Laufzeitersetzungen vorgenommen
 *  (Bsp.: der String für den MKS-Flow Kontroller)
 */
var run = function(path, s, p, task){
  var mpid    = path[0]
    , no      = path[1]
    , path_e  = [mpid, "exchange"]
    , path_s  = [mpid, no, "state", s, p];

  if(_.isObject(task)         &&
     task.Action              &&
     _.isFunction(worker[task.Action])){
    var ok      = true
      , ro      = {ok:ok}
      , exec    = task.Action
      , cmdstr  = cstr.exec
      , tsknm   = task.TaskName
    // add runtime info to task
    task.MpId = mpid;
    task.Seq  = s;
    task.Par  = p;

    task_exchange(path_e, task, ok, cmdstr, function(){
      task_stop_if(path_e, task, ok, cmdstr, function(){
        task_run_if(path_e, task, ok, cmdstr, function(){

          mem.publish("worker", exec, function(err){
            if(!err){
              log.info(ok
                      ,"executed event published");
              var exec   = task.Action;

              if(ok){
                var delay = parseInt(p, 10) * deflt.system.par_delay_mult;
                setTimeout(function(){
                  log.info(ro
                          , "start " + tsknm + " with a delay of " + delay + "ms")
                  // -------------------------------------------------------
                  worker[exec](task, path, function(res){
                    var path_s = path.concat(["state", s, p]);
                    if(res.again){
                      mem.set( path_s, cstr.ready, function(){
                        mem.publish("state",  path_s, function(err){
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
                      mem.set(path_s, cmdstr, function(){
                        mem.publish("state",  path_s, function(err){
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
                      mem.set(path_s, cstr.error, function(){
                        mem.publish("state",  path_s, function(err){
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
                      })
                    } // return with error
                  })
                  // -------------------------------------------------------
                }, delay);
              }else{
                mem.set(path_s, cmdstr, function(){
                  mem.publish("state",  path_s, function(err){
                    if(!err){
                      log.info(ro
                              ,"state event published");
                    }else{
                      log.error({error: err}
                               , "unable to publish state event");
                    }
                  }); // publish
                })
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
    mem.set(path_s, cstr.error, function(){
      log.error(task
               , "task don't work (most likely unknown Action)")
    });
  }
}
  module.exports  = run;


  var task_exchange = function(path, task, ok, cmdstr, cb){

    // --- Runtime data exchange
    if(task.FromExchange){
      if(_.isArray(task.FromExchange)){
        var N = task.FromExchange.length;
        for( var l = 0; l < N; l++){
          var path_l = task.FromExchange[l].split(".");
          mem.get(path.concat(path_l), function(last){
                                         return function(err, value){
                                           if(!err){
                                             var    token = task.FromExchange[l];
                                             if(token && value){
                                               task =  utils.replace_in_with(task, token , value );
                                             }else{
                                               ok = false;
                                             }
                                           }else{
                                             log.info({error: err}
                                                     , "can not read exchange at " + task.FromExchange[l]);
                                           }
                                           if(last){
                                             cb();
                                           }
                                         }
                                       }(l == N - 1)); // get exchange
        } // for
      }else{
        var path_l = task.FromExchange.split(".");
        mem.get(path.concat(path_l), function(err, value){
          if(!err){
            var token = task.FromExchange;
            if(token && value){
              task =  utils.replace_in_with(task, token , value);
            }else{
              ok = false;
            }
          }else{
            log.info({error: err}
                    , "can not read exchange at "+ task.FromExchange);
          }
          cb();
        })// get exchange
      } // else
    }else{ // Exchange
      cb();
    }
  }

  var task_stop_if = function(path, task, ok, cmdstr, cb){
    var tsknm = task.TaskName

    // --- StopIf
    if(task.StopIf){
      var path_s = task.StopIf.split(".");
          mem.get(path.concat(path_s), function(err, value){
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
                                            cb();
                                          }); // get stop if state
             }else{ // StopIf
               cb();
             }
           }

  var task_run_if = function(path, task, ok, cmdstr, cb){
    var tsknm = task.TaskName
  // --- RunIf
  if(task.RunIf){
    var path_r = task.RunIf.split(".");
    mem.get(path.concat(path_r), function(err, value){
      if(!err){
        if(value == "true"){
          ok     = true;
          cmdstr = cstr.exec;
        }else{
          ok     = false;
          cmdstr = cstr.ready;
        }
      }else{
        log.info({error: err}
                , "can not read exchange at " + task.RunIf);
      }
      cb();
    }); // get run if state
  }else{// RunIf
    cb();
  }
}