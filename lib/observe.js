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

mem.subscribe("executed", function(err){
  if(!err){
    log.info(ok
            , "observe subscribed to executed channel");
  }
})

mem.on('message', function(ch, path){
  var pathstr = path.join(" ")

  if(ch == "buildup"){
    observe(path);
    log.info({path: pathstr}
            , "start observe " + pathstr);
  }

  if(ch == "executed"){
    var mpid = path[0]
      , no   = path[1]
    mem.get([mpid, "recipe", no], function(err, recipe){
      walk.cp([mpid, "state", no], recipe , cstr.ready, function(){
        log.info({ok:true}
                , "sync definition and state of container: " + no);
      });
    });
  }

})

var observe = function(path){
  mem.get(path.concat(["meta"]), function(err, meta){
    var mpid = meta.id;
    log.info(ok
            , "start observing Mp");
    timerId[mpid] = {};

    var notimerid
      , date  = new Date()
      , stime = date.getTime()
      , epath = path.concat(["exchange"])

    mem.set(epath.concat(["start_time", "Value", "value"]), stime)
    mem.set(epath.concat(["start_time", "Unit", "value"]), "ms");
    mem.set(epath.concat(["run_time", "Unit", "value"]), "ms");

    timerId[mpid].main = setInterval(
      function(){
        var rtime = (new Date()).getTime() - stime
          , cpath = path.concat(["ctrl"]);

        mem.set(epath.concat(["run_time", "Value", "value"]), rtime);
        mem.get(cpath, function(err, c){
          _.each(c, function (cmdstr, no){

            var cmdarr = utils.cmd_to_array(cmdstr)
              , cmd    = _.first(cmdarr)
              , cpath  = path.concat([ "ctrl", no])
              , spath  = path.concat(["state", no])

            mem.get(spath, function(err, state_no){

              if(  _.every(utils.as_arr(state_no), function(i){return i == cstr.exec})){ // publish only once
                mem.set(cpath, "executed", function(){
                  mem.publish("executed", [mpid, no], function(err){
                    if(!err){
                      log.info(ok,"executed event published");
                    }else{
                      log.info({error:err},"error on publishing executed event");
                    }
                  });
                }); // set ctrl
              }

              if(cmd == cstr.load){
                mem.set(cpath, "loading", function(){
                  mem.publish("load", [mpid, no], function(err){
                    if(!err){
                      log.info(ok,"load event published");
                    }else{
                      log.info({error:err},"error on publishing load event");
                    }
                  });
                }); // set ctrl loading
              } // load


            }); //nostate
          }); // each container
        }); // get ctrl
        }, sh); // intervall
      }); // meta
  };
module.exports = observe;
