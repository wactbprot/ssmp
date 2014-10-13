var name     = "ssmp",
    _        = require("underscore"),
    bunyan   = require("bunyan"),
    deflt    = require("./default"),
    worker   = require("./worker"),
    utils    = require("./utils"),
    log      = bunyan.createLogger({name: deflt.appname}),
    ctrlstr  = deflt.ctrlStr,
    nextCall = true;

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
module.exports  = function(mp, path){
  mp.state.get(path, function(state){

    if(state === ctrlstr.ready){

      mp.state.set(path, ctrlstr.work, function(){
        mp.recipe.get(path, function(task){

          if(_.isObject(task)         &&
             task.Action              &&
             _.isFunction(worker[task.Action])){

            var exec   = task.Action,
                ok     = true,
                cmdstr = ctrlstr.exec,
                tsknm  = task.TaskName,
                oktxt  = "task "
                       + tsknm
                       + " executed";

            // --- Runtime data exchange
            if(task.FromExchange){
              if(_.isArray(task.FromExchange)){

                for( var l = 0; l < task.FromExchange.length; l++){

                  var epath = task.FromExchange[l].split(".");
                  mp.exchange.get(epath, function(value){
                    var    token = task.FromExchange[l];
                    if(token && value){
                      task =  utils.replace_in_with(task, token , value );
                    }else{
                      ok = false;
                    }
                  }) // get exchange
                } // for
              }else{
                var epath = task.FromExchange.split(".");
                mp.exchange.get(epath, function(value){
                  var token = task.FromExchange;
                  if(token && value){
                    task =  utils.replace_in_with(task, token , value );
                  }else{
                    ok = false;
                  }
                })// get exchange
              } // else
            } // Exchange

            // --- StopIf
            if(task.StopIf){
              mp.exchange.get(task.StopIf.split("."), function(sistate){
                if(sistate ==  true || sistate == "true"){
                  ok = false;
                  cmdstr = ctrlstr.exec;
                  oktxt = "task "
                        + tsknm
                        + " ends";
                }else{
                  ok = true;
                  cmdstr = ctrlstr.ready;
                  oktxt = "task "
                        + tsknm
                        + " waiting for task.StopIf to become true";
                }
              }); // get stop if state
            } // StopIf

            // --- RunIf
            if(task.RunIf){
              mp.exchange.get(task.RunIf.split("."), function(ristate){
                if(ristate == "true"){
                  ok = true;
                  cmdstr = ctrlstr.exec;
                  oktxt = "task " + tsknm + " started";
                }else{
                  ok = false;
                  cmdstr = ctrlstr.ready;
                  oktxt = "task " + tsknm + " awaiting data from exchange";
                }
              }); // get run if state
            }// RunIf

            // --- worker[exec]
            if(ok){
              var delay = parseInt(path[2],10) * deflt.system.pardelaymult;
              setTimeout(function(){

                log.info({ok:true}
                        , "start "
                        + tsknm
                        + " with a delay of "
                        + delay
                        + "ms")

                // -------------------------------------------------------
                worker[exec](mp, task, path, function(res){
                  if(res.again){
                    mp.state.set(path, ctrlstr.ready, function(){
                      //log.info(oktxt)
                    })
                  } // return again

                  if(res.ok){
                    mp.state.set(path, cmdstr, function(){
                      log.info(oktxt)
                    })
                  } // return ok

                  if(res.error){
                    mp.state.set(path, ctrlstr.error, function(){
                      log.error(res
                               , "task "
                               + tsknm
                               + " task execution failed")
                    })
                  } // return with error
                })
                // -------------------------------------------------------
              }, delay);

            }else{
              mp.state.set(path, cmdstr, function(){
                // log.info(oktxt)
              })
            }// worker[exec]

          }else{// task is obj
            mp.state.set(path, ctrlstr.error, function(){
              log.error(task
                       , "task don't work (most likely unknown Action)")
            });
          }
        }); // working
      }); // get task
    } // ready
  }); // get state
};
