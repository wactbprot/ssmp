var _        = require("underscore")
  , bunyan   = require("bunyan")
  , ndata    = require('ndata')
  , deflt    = require("./default")
  , walk     = require("./walk")
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
    mem.get(path.concat(["state"]), function(state){
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

      var exec   = task.Action,
          ok     = true,
          cmdstr = cstr.exec,
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
            cmdstr = cstr.exec;
            oktxt = "task "
                  + tsknm
                  + " ends";
          }else{
            ok = true;
            cmdstr = cstr.ready;
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
            cmdstr = cstr.exec;
            oktxt = "task " + tsknm + " started";
          }else{
            ok = false;
            cmdstr = cstr.ready;
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
              mp.state.set(path, cstr.ready, function(){
                //log.info(oktxt)
              })
            } // return again

            if(res.ok){
              mp.state.set(path, cmdstr, function(){
                log.info(oktxt)
              })
            } // return ok

            if(res.error){
              mp.state.set(path, cstr.error, function(){
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
      mp.state.set(path, cstr.error, function(){
        log.error(task
                 , "task don't work (most likely unknown Action)")
      });
    }
  }); // working
}); // get task
} // ready
}); // get state
};

module.exports  = run;