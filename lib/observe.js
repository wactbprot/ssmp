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
  , mem      = ndata.createClient({port: deflt.mem.port});

/**
 * Description
 * @method ini
 * @param {Function} cb
 */
var ini = function(cb){

  mem.subscribe("stop_all_container_obs", function(err){
    if(!err){
      log.info(ok
              , "observe.js subscribed to stop_all_container_obs channel");
      mem.subscribe("start_container_obs", function(err){
        if(!err){
          log.info(ok
                  , "observe.js subscribed to start_container_obs channel");

          mem.subscribe("stop_container_obs", function(err){
            if(!err){
              log.info(ok
                      , "observe.js subscribed to stop_container_obs channel");

              mem.subscribe("executed", function(err){
                if(!err){
                  log.info(ok
                          , "observe.js subscribed to executed channel");

                  mem.subscribe("stop", function(err){
                    if(!err){
                      log.info(ok
                              , "observe.js subscribed to stop channel");
                      if( _.isFunction(cb)){
                        cb(ok);
                      }
                    }
                  });
                }
              });
            }
          });
        }
      });
    }
  });
}
exports.ini = ini;

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
var observe = function(ch, path){
  var strpath = path.join(" ")
    , mpid = path[0]
    , no   = path[1]

  log.info(ok
          , "observe.js received message on channel " + ch);

  if(ch == "executed" || ch == "stop"){

    log.info(ok
            , "receice " + ch +" event "
            + "on "+ mpid+ " container "+no+", try to set state ready");
    mem.get([mpid, no, "recipe"], function(err, recipe){
      if(!err){
        utils.cp([mpid, no, "state"], recipe , cstr.ready, function(){
          mem.publish("state", path, function(err){
            if(!err){
              log.info(ok
                      , "sync definition and state of container: "
                      + no + " next: check ctrl");
              mem.get([mpid, no, "ctrl"], function(err, cmdstr){
                if(!err && cmdstr == "" || cmdstr == "stoping" ){
                  mem.set([mpid, no, "ctrl"], cstr.ready, function(err){
                    if(!err){
                      log.info(ok
                              , "set container to ready");
                    }else{
                      log.error({error:err}
                               , "on attempt to set container to ready");
                    }
                  }); // ctrl set
                } // cmd == ""
              }); // ctrl get
            }
          }); // publish state
        });
      }else{
        log.error({error:err}
                 , "error on try to get recipe");
      }
    });
  } // if executed

  if(ch == "stop_container_obs"){
    console.log(".......::::::::")
    console.log(" --> observe stop_container_obs: " + no)
    console.log(".......::::::::")
    if(timerId[mpid] && _.isObject(timerId[mpid])){
      clearInterval(timerId[mpid][no]);
      timerId[mpid][no] = 0;
      log.info(ok
              , "clear interval on event stop_container_obs for container: " + no);
    }
  } // if stop_container_obs

  if(ch == "stop_all_container_obs"){
    console.log(".......::::::::")
    console.log(" --> observe stop_all_container_obs")
    console.log(".......::::::::")
    if(timerId[mpid] && _.isObject(timerId[mpid])){
      for(var nno in  timerId[mpid]){
        clearInterval(timerId[mpid][nno]);
        timerId[mpid][nno] = 0;
        log.info(ok
                , "clear interval on event stop_all_container_obs for container: " + nno);
      }
    }
  } // if stop_container_obs

  if(ch == "start_container_obs"){

    console.log(".......::::::::")
    console.log(" --> observe start_container_obs: " + no)
    console.log(".......::::::::")

    mem.get([mpid, "meta"], function(err, meta){
      var date   = new Date()
        , stime  = date.getTime()
        , path_e = [mpid, "exchange"]

      mem.set(path_e.concat(["start_time", "Value", "value"]), stime, function(err){
        mem.set(path_e.concat(["start_time", "Unit", "value"]), "ms", function(err){
          mem.set(path_e.concat(["run_time", "Unit", "value"]), "ms", function(err){

            log.info(ok
                    , "start observing " + mpid + " with " + sh + "ms");
            if(!timerId[mpid]){
              timerId[mpid] = {};
            }
            if(!timerId[mpid][no]){
              timerId[mpid][no] = setInterval(function(){
                                    var rtime  = (new Date()).getTime() - stime
                                      , path_r = path_e.concat(["run_time"])
                                      , path_t =  path_r.concat(["Value", "value"]);
                                    mem.set(path_t, rtime, function(err){
                                      mem.publish("timer", path, function(err){
                                        if(err){
                                          log.error({error:err}
                                                   , " faild to publish timer event")
                                        }
                                      }); // timer
                                      mem.get([mpid, no, "ctrl"], function(err, cmdstr){
                                        if(_.isString(cmdstr)){
                                          var cmd    = _.first(utils.cmd_to_array(cmdstr))
                                            , nopath = [mpid, no]
                                            , spath  = [mpid, no, "state"];

                                          mem.get(spath, function(err, state_no){

                                            var flat_state = utils.as_arr(state_no)
                                              , all_exec   = utils.all_same(flat_state, cstr.exec);

                                            if( all_exec ){
                                              switch(cmd){
                                                case "monitoring":
                                                shout([mpid], cmdstr, no, cstr.mon, cstr.exec);
                                                break;
                                                case "":
                                                shout([mpid], cmdstr, no, cstr.ready, cstr.exec);
                                                break;
                                                default:
                                                shout([mpid], cmdstr, no, "", cstr.exec);
                                                break;
                                              }
                                            }else{
                                              switch(cmd){
                                                case cstr.stop:
                                                shout([mpid], cmdstr, no, "stoping", cstr.stop);
                                                break;

                                                case cstr.mon:
                                                shout([mpid], cmdstr, no, "monitoring", cstr.run);
                                                break;

                                                case cstr.load:
                                                shout([mpid], cmdstr, no, "loading", cstr.load);
                                                break;

                                                case cstr.run:
                                                shout([mpid], cmdstr, no, "running", cstr.run);
                                                break;
                                              } // swich
                                            }
                                          }); //nostate
                                        } // cmdstr is string
                                      }); // get ctrl
                                    }); // r time
                                  }, sh); // intervall
            }else{ // timerId ae
              log.info(ok
                      , " observe timer for " + mpid + " already exists")
            }
          });
        });
      });
    }); // meta
  }// start_container_obs
}



mem.on('message',function(ch, path){
  observe(ch, path)
});

/**
 * Publiziert Änderungen
 * @method shout
 * @param {Array} path
 * @param {String} cmdstr
 * @param {Number} no
 * @param {String} cstr
 * @param {String} channel
 */
var shout = function(path, cmdstr, no, cstr, channel){
  var cmdarr = utils.cmd_to_array(cmdstr)
    , cmdH   = _.first(cmdarr)
    , cmdT   = _.rest(cmdarr)
    , nopath = path.concat([no])
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

      console.log(".......::::::::")
      console.log(" observe -->  " + channel)
      console.log(".......::::::::")

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
