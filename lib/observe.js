/**
 * Die Funktion ```observe()``` beobachtet periodisch
 * die ```/ctrl``` Schnittstelle aller _Container_ des
 * Messprogramms  und deren ```/state``` (Zustand der einzelnen Tasks).
 *
 * Für den Fall, dass alle
 * ```state```s eines _Containers_  den Wert ```executed```
 * besitzen, wird deren Wert auf  ```ready``` zurückgesetzt.
 *
 * Der _Container gilt dann als abgearbeitet.
 * der ```/ctrl``` String des _Containers_ wird dann
 * ebenfalls auf den Wert ```ready``` gesetzt.
 *
 * Die Funktion wird durch den
 * Messprogramminitialisierungsprozess gestartet.
 *
 * Die ```observe()``` Funktion reagiert auf:
 *
 * - load
 * - run
 * - stop
 * - pause
 *
 * Darüber hinaus werden die beiden ```/exchange```
 * Objekte:
 * ```
 * "start_time": {
 *     "Value": {
 *         "value": 1408712602709
 *     },
 *     "Unit": {
 *         "value": "ms"
 *     }
 * }
 * ```
 * und
 * ```
 * "run_time": {
 *     "Unit": {
 *         "value": "ms"
 *     },
 *     "Value": {
 *         "value": 928429
 *     }
 *
 * }
 * ```
 * erstellt; letzterer periodisch aufgefrischt.
 *
 */

var _        = require("underscore")
  , bunyan   = require("bunyan")
  , clone    = require("clone")
  , ndata    = require('ndata')
  , utils    = require("./utils")
  , deflt    = require("./default")
  , log      = bunyan.createLogger({name: deflt.appname})
  , sh       = deflt.system.heartbeat
  , ch       = deflt.container.heartbeat
  , cstr     = deflt.ctrlStr
  , timerId  = {}
  , ok       = {ok:true}
  , mem      = ndata.createClient({port: 9000});

mem.subscribe("buildup", function(err){
  if(!err){
    log.info(ok
            , "observe.js subscribed to buildup channel");
  }
})
mem.subscribe("buildown", function(err){
  if(!err){
    log.info(ok
            , "observe.js subscribed to builddown channel");
  }
})

mem.subscribe("executed", function(err){
  if(!err){
    log.info(ok
            , "observe.js subscribed to executed channel");
  }
})

mem.on('message', function(ch, path){
  var strpath = path.join(" ")

  if(ch == "executed"){
    log.info(ok
            , "receice executed event, try to set state ready");
    mem.get(path.concat(["recipe"]), function(err, recipe){
      if(!err){
        utils.cp(path.concat(["state"]), recipe , cstr.ready, function(){
          mem.publish("state", path, function(err){
            if(!err){
              log.info(ok
                      , "sync definition and state of container: " + strpath);
            }
          }); // publish state
        });
      }else{
        log.error({error:err}
                 , "error on try to get recipe");
      }
    });
  }
}); // on

mem.on('message', function(ch, path){
  var strpath = path.join(" ")

  if(ch == "builddown"){
    var mpid      = path[0]
    clearInterval(timerId[mpid]);
    timerId[mpid] = {};
    log.info(ok
            , "clear interval on event builddown");
  }
  if(ch == "buildup"){
    mem.get(path.concat(["meta"]), function(err, meta){
      var notimerid
        , mpid  = path[0]
        , date  = new Date()
        , stime = date.getTime()
        , epath = path.concat(["exchange"])

      timerId[mpid] = {};

      mem.set(epath.concat(["start_time", "Value", "value"]), stime, function(err){
        mem.set(epath.concat(["start_time", "Unit", "value"]), "ms", function(err){
          mem.set(epath.concat(["run_time", "Unit", "value"]), "ms", function(err){

            log.info(ok
                    , "start observing " + mpid + " with " + sh + "ms");

            timerId[mpid] = setInterval(function(){
                              var rtime = (new Date()).getTime() - stime
                                , path_r = epath.concat(["run_time"])
                                , path_t =  path_r.concat(["Value", "value"]);
                              mem.set(path_t, rtime, function(err){
                                mem.publish("timer", path, function(err){
                                  if(err){
                                    log.error({error:err}
                                             , " faild to publish timer event")
                                  }
                                }); // timer

                                for(var i = 0; i < meta.container.N; i++){
                                  mem.get(path.concat([i, "ctrl"]), function(no){
                                                                      return function(err, cmdstr){

                                                                        var cmd   = _.first(utils.cmd_to_array(cmdstr))
                                                                          , nopath = path.concat([no])
                                                                          , spath  = nopath.concat(["state"]);

                                                                        mem.get(spath, function(err, state_no){
                                                                          var allExec =  _.every(utils.as_arr(state_no)
                                                                                                , function(i){
                                                                                                    return i == cstr.exec
                                                                                                  })
                                                                          if( allExec ){
                                                                            switch(cmd){
                                                                              case "monitoring":
                                                                              shout(path, cmdstr, no, cstr.mon, cstr.exec);
                                                                              break;
                                                                              case "":
                                                                              shout(path, cmdstr, no, cstr.ready, cstr.exec);
                                                                              break;
                                                                              default:
                                                                              shout(path, cmdstr, no, "", cstr.exec);
                                                                              break;
                                                                            }
                                                                          }else{
                                                                            switch(cmd){
                                                                              case cstr.mon:
                                                                              shout(path, cmdstr, no, "monitoring", cstr.run);
                                                                              break;

                                                                              case cstr.load:
                                                                              shout(path, cmdstr, no, "loading", cstr.load);
                                                                              break;

                                                                              case cstr.run:
                                                                              shout(path, cmdstr, no, "running", cstr.run);
                                                                              break;
                                                                            } // swich
                                                                          }
                                                                        }); //nostate
                                                                      }}(i)); // get ctrl
                                } //for
                              }); // r time
                            }, sh); // intervall
          });
        });
      });
    }); // meta
    log.info({path: strpath}
            , "start observe " + strpath);
  }
})


var shout = function(path, cmdstr, no, cstr, channel){
  var cmdarr = utils.cmd_to_array(cmdstr)
    , cmdH   = _.first(cmdarr)
    , cmdT   = _.rest(cmdarr)
    , nopath =  path.concat([no])
    , cpath  = nopath.concat(["ctrl"])
    , spath  = nopath.concat(["state"])
    , ncmdstr;

  if(cstr){
    ncmdstr = [cstr].concat(cmdT).join(";")
  }else{
    ncmdstr = cmdT.join(";")
  }
  mem.set(cpath, ncmdstr, function(){
    mem.publish(channel, nopath, function(err){
      if(!err){
        log.info(ok
                , "published on channel: " + channel);
      }else{
        log.info({error:err}
                ,"error on publishing on channel: " + channel);
      }
    });
  }); // set ctrl loading

}
