var _        = require("underscore")
  , bunyan   = require("bunyan")
  , ndata    = require('ndata')
  , deflt    = require("./default")
  , worker   = require("./worker")
  , utils    = require("./utils")
  , log      = bunyan.createLogger({name: deflt.appname})
  , cstr     = deflt.ctrlStr
  , ok       = {ok:true}
  , mem      = ndata.createClient({port: 9000});

mem.subscribe("run", function(err){
  if(!err){
    log.info(ok
            , "run.js subscribed to run channel");
  }
})

mem.on('message', function(ch, path){
  var strpath = path.join(" ")
    , endseq  = false;
  if(ch == "run"){
    log.info(ok
            , "receice run event");
    mem.get(path.concat(["state"]), function(err, state){
      if(!err){
        for(var i in state){
          for(var j in state[i]){
            if(state[i][j] == cstr.ready){
              endseq = true;
              var pathrij = path.concat(["recipe",i,j]);
              mem.get(pathrij, function(path, s, p){
                                 return function(task){
                                   run(path, s, p, task)
                                 }
                               }(path, i, j))
            } // if ready
          }  // j
          if(endseq){
            break;
          }
        } // i
      }else{
        log.info({error: err}
                , "can not read state");

      }
    }); // state
  }
})
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

  if(_.isObject(task)         &&
     task.Action              &&
     _.isFunction(worker[task.Action])){
    var ok        = true
      , exec      = task.Action
      , cmdstr    = cstr.exec
      , tsknm     = task.TaskName
      , exchpath  = [path[0], "exchange"]

    task_exchange(exchpath, task, ok, cmdstr, function(exchpath, task, ok, cmdstr, cb){
      task_stop_if(exchpath, task, ok, cmdstr, function(exchpath, task, ok, cmdstr, cb){
        task_run_if(exchpath, task, ok, cmdstr, function(exchpath, task, ok, cmdstr, cb){

          mem.publish("worker", exec, function(err){
            if(!err){
              log.info(ok
                      ,"executed event published");
              var exec   = task.Action
                , tsknm  = task.TaskName;
              if(ok){
                var delay = parseInt(p, 10) * deflt.system.par_delay_mult;
                setTimeout(function(){
                  log.info({ok:true}
                          , "start " + tsknm + " with a delay of " + delay + "ms")
                  // -------------------------------------------------------
                  worker[exec](task, path, function(res){
                    if(res.again){
                      mem.set(path.concat(["state", s, p]), cstr.ready, function(){
                        //log.info(oktxt)
                      })
                    } // return again
                    if(res.ok){
                      mem.set(path.concat(["state", s, p]), cmdstr, function(){
                      })
                    } // return ok
                    if(res.error){
                      mem.set(path.concat(["state", s, p]), cstr.error, function(){
                        log.error(res
                                 , "task " + tsknm + " task execution failed")
                      })
                    } // return with error
                  })
                  // -------------------------------------------------------
                }, delay);

              }else{
                mem.set(path.concat(["state", s, p]), cmdstr, function(){
                  // log.info(oktxt)
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
    mem.set(path.concat(["state", s, p]), cstr.error, function(){
      log.error(task
               , "task don't work (most likely unknown Action)")
    });
  }
}
module.exports  = run;

var task_exec = function(exchpath, task, ok, cmdstr, cb){
}

var task_exchange = function(exchpath, task, ok, cmdstr, cb){

  // --- Runtime data exchange
  if(task.FromExchange){
    if(_.isArray(task.FromExchange)){
      var N = task.FromExchange.length;
      for( var l = 0; l < N; l++){
        var pathl = task.FromExchange[l].split(".");
        mem.get(exchpath.concate(pathl), function(last){
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
                                                 cb(exchpath, task, ok, cmdstr, cb);
                                               }
                                           }
                                         }(l == N - 1)); // get exchange
      } // for
    }else{
      var pathl = task.FromExchange.split(".");
      mem.get(exchpath.concate(pathl), function(err, value){
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
        cb(exchpath, task, ok, cmdstr, cb);
      })// get exchange
    } // else
  } // Exchange
}

var task_stop_if = function(exchpath, task, ok, cmdstr, cb){
  var tsknm = task.TaskName

  // --- StopIf
  if(task.StopIf){
    var paths = task.StopIf.split(".");
    mem.get(exchpath.concate(paths), function(err, value){
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
      cb(exchpath, task, ok, cmdstr, cb);
    }); // get stop if state
  } // StopIf
}

var task_run_if = function(exchpath, task, ok, cmdstr, cb){
  var tsknm = task.TaskName
  // --- RunIf
  if(task.RunIf){
    var pathr = task.RunIf.split(".");
    mem.get(exchpath.concate(pathr), function(err, value){
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
      cb(exchpath, task, ok, cmdstr, cb);
    }); // get run if state
  }// RunIf
}