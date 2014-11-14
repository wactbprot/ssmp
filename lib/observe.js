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
  , walk     = require("./walk")
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
            , "observe subscribed to buildup channel");
  }
})
mem.subscribe("buildown", function(err){
  if(!err){
    log.info(ok
            , "observe subscribed to builddown channel");
  }
})


mem.on('message', function(ch, path){
  var strpath = path.join(" ")

  if(ch == "buildup"){
    observe(path);
    log.info({path: strpath}
            , "start observe " + strpath);
  }
})

var observe = function(path){
  mem.get(path.concat(["meta"]), function(err, meta){
    var notimerid
      , mpid  = path[0]
      , date  = new Date()
      , stime = date.getTime()
      , epath = path.concat(["exchange"])

    timerId[mpid] = {};

    mem.set(epath.concat(["start_time", "Value", "value"]), stime)
    mem.set(epath.concat(["start_time", "Unit", "value"]), "ms");
    mem.set(epath.concat(["run_time", "Unit", "value"]), "ms");

    log.info(ok
            , "start observing " + mpid + " with " + sh + "ms");

    timerId[mpid].main = setInterval(
      function(){
        var rtime = (new Date()).getTime() - stime
        mem.set(epath.concat(["run_time", "Value", "value"]), rtime);
        for(var i = 0; i < meta.contN; i++){
          mem.get(path.concat([i, "ctrl"]), function(no){
            return function(err, cmdstr){

              var cmdarr = utils.cmd_to_array(cmdstr)
                , cmd    = _.first(cmdarr)
                , nopath =  path.concat([no])
                , cpath  = nopath.concat(["ctrl"])
                , spath  = nopath.concat(["state"])

              mem.get(spath, function(err, state_no){
                var allExec =  _.every(utils.as_arr(state_no)
                                      , function(i){
                                          return i == cstr.exec
                                        })
                if( allExec ){ // publish only once
                  if(timerId[path] !== 0){
                    clearInterval(timerId[path]);
                    timerId[path] = 0;
                    log.info(ok
                            , "clear timer id (stoped)container: " + no);
                  }

                  mem.publish("executed", nopath, function(err){
                    if(!err){
                      log.info(ok
                              ,"executed event published");
                    }else{
                      log.info({error:err}
                              ,"error on publishing executed event");
                    }
                  }); // set ctrl
                }

                if(cmd == cstr.load){
                  mem.set(cpath, "loading", function(){
                    mem.publish("load", nopath, function(err){
                      if(!err){
                        log.info(ok
                                ,"load event published");
                      }else{
                        log.info({error:err}
                                ,"error on publishing load event");
                      }
                    });
                  }); // set ctrl loading
                } // load


              }); //nostate
            }}(i)); // get ctrl
        } //for
      }, sh); // intervall
  }); // meta
};
module.exports = observe;
