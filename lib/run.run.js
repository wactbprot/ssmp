/**
 * @module run.run
 */
var _        = require("underscore")
  , bunyan   = require("bunyan")
  , broker   = require("sc-broker")
  , clone    = require("clone")
  , conf     = require("./conf")
  , worker   = require("./worker")
  , utils    = require("./utils")
  , cstr     = conf.ctrlStr
  , log      = bunyan.createLogger({name: conf.app.name + ".run.run",
                                    streams: conf.log.streams
                                   })
  , mem      = broker.createClient({port: conf.mem.port})
  , ro       = {ok:true}
  , err
  , run_if           =  require("./run.runIf")
  , stop_if          =  require("./run.stopIf")
  , exchange_replace =  require("./run.exchangeReplace")
  , script           =  require("./run.script");

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
module.exports = function (path, s, p, task){
  var mpid    = path[0]
    , no      = path[1];

  if(_.isObject(task) && task.Action && _.isFunction (worker[task.Action])) {
    var ok      = true
      , exec    = task.Action
      , cmdstr  = cstr.exec
      , tsknm   = task.TaskName;

    exchange_replace([mpid, "exchange"], task, ok, cmdstr, function (task, ok, cmdstr){
      script([mpid, "exchange"], task, ok, cmdstr, function (task, ok, cmdstr){
        run_if([mpid, "exchange"], task, ok, cmdstr, function (task, ok, cmdstr){
          stop_if([mpid, "exchange"], task, ok, cmdstr, function (task, ok, cmdstr){
            mem.publish("worker", exec, function (err){
              if(!err){
                if(ok){
                  // +1 in order to never get a 0 delay
                  var delay = (parseInt(p, 10)+1) * conf.system.par_delay_mult;
                    setTimeout(function (){
                      log.trace(ro
                               , "start " + tsknm
                               + " with a delay of "
                               + delay + "ms")
                      task.Path = path;
                      if(task.NoLog){
                        log.trace(task
                                 , "completed task for worker");

                      }else{
                        log.trace({task:task}
                                 , "completed task for worker");

                      }
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
                            log.trace(ro
                                     ,"callback executed; "
                                     + "no callback related state changes");
                          }

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
      }); // script
    }); // exchange
  }else{// task is obj
    err = new Error("task don't work");
    mem.set([mpid, no, "state", s, p], cstr.error, function (){
      log.error(err
               , "task don't work; most likely unknown Action")
    });
  }
}
