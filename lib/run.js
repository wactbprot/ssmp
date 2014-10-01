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
  var state = mp.state.get(path);

  if(state === ctrlstr.ready){


    mp.state.set(path, ctrlstr.work, function(){
      var task = mp.recipe.get(path);

      if(_.isObject(task)         &&
         task.Action              &&
         _.isFunction(worker[task.Action])){

        var exec   = task.Action,
            ok     = true,
            cmdstr = ctrlstr.exec,
            tsknm  = task.TaskName,
            oktxt  = "task " + tsknm + " executed";

        // --- Runtime data exchange
        if(task.FromExchange){
          if(_.isArray(task.FromExchange)){

            for( var l = 0; l < task.FromExchange.length; l++){
              var epath = task.FromExchange[l].split("."),
                  token = task.FromExchange[l],
                  value = mp.exchange.get(epath);

              if(token && value){
                task =  utils.replace_in_with(task, token , value );
              }else{
                ok = false;
              }
            }
          }else{
            var epath = task.FromExchange.split("."),
                token = task.FromExchange,
                value = mp.exchange.get(epath);

            if(token && value){
              task =  utils.replace_in_with(task, token , value );
            }else{
              ok = false;
            }
          }
        } // Exchange

        // --- StopIf
        if(task.StopIf){
          if(mp.exchange.get(task.StopIf.split(".")) == "true"){
            ok = false;
            cmdstr = ctrlstr.exec;
            oktxt = "task " + tsknm + " ends";
          }else{
            ok = true;
            cmdstr = ctrlstr.ready;
            oktxt = "task "
                  + tsknm
                  + " waiting for task.StopIf to become true";
          }
        } // StopIf

        // --- RunIf
        if(task.RunIf){
          if(mp.exchange.get(task.RunIf.split(".")) == "true"){
            ok = true;
            cmdstr = ctrlstr.exec;
            oktxt = "task " + tsknm + " started";
          }else{
            ok = false;
            cmdstr = ctrlstr.ready;
            oktxt = "task " + tsknm + " awaiting data from exchange";
          }
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
                  log.error(res, "task " + tsknm + " task execution failed")
                })
              } // return with error
            })},delay);

        }else{
          mp.state.set(path, cmdstr, function(){
           // log.info(oktxt)
          })
        }// worker[exec]

      }else{// task is obj
        mp.state.set(path, ctrlstr.error, function(){
          log.error(task, "task don't work (most likely unknown Action)")
        });
      }
    }); // working
  } // ready
};
