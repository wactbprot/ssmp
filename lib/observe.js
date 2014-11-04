var _        = require("underscore"),
    bunyan   = require("bunyan"),
    clone    = require("clone"),
    run      = require("./run"),
    load     = require("./load"),
    gen      = require("./generic"),
    walk     = require("./walk"),
    utils    = require("./utils"),
    deflt    = require("./default"),
    log      = bunyan.createLogger({name: deflt.appname}),
    sh       = deflt.system.heartbeat,
    ch       = deflt.container.heartbeat,
    dcs      = deflt.ctrlStr,
    ready    = dcs.ready,
    pause    = dcs.pause,
    exec     = dcs.exec,
    error    = dcs.error,
    runstr   = dcs.run,
    stop     = dcs.stop,
    loadstr  = dcs.load,
    mon      = dcs.mon
  , timerId = {};

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
 * @param {Object} mp Messprog.-Objekt
 */
var observe = function(mp){
  mp.meta.get([], function(meta){
    var mpname = meta.name;
    log.info({ok:true}
            , "start observing Mp");
    timerId[mpname] = {};

    var date  = new Date()
      , stime = date.getTime()
      , notimerid;

    mp.exchange.set(["start_time", "Value", "value"], stime);
    mp.exchange.set(["start_time", "Unit", "value"], "ms");
    mp.exchange.set(["run_time", "Unit", "value"], "ms");
    timerId[mpname].main = setInterval(
      function(){
        var rtime = (new Date()).getTime() - stime;
        mp.exchange.set(["run_time", "Value", "value"], rtime);
        mp.ctrl.get([], function(c){
          _.each(c, function (cmdstr, no){

            var cmdarr = utils.cmd_to_array(cmdstr)
              , cmd    = _.first(cmdarr);
            walk.checkstate(mp, no, function(state){
              //
              //---*--- executed ---*---
              //
              if(state === exec){
                var nctrlstr  = _.rest(cmdarr).join(";")
                if(nctrlstr === ""){
                  nctrlstr = ready;
                }

                if(timerId[mpname][no] !== 0){
                  clearInterval(timerId[mpname][no]);
                  timerId[mpname][no] = 0;
                }

                mp.state.get([no], function(nostate){
                  walk.setstate(mp, no, nostate, ready, function(){
                    if(cmd !==  mon){
                      mp.ctrl.set([no], nctrlstr, function(){
                        log.info({ container : no, ctrl : nctrlstr}
                                , "all executed, switch ctrl to: "
                                + nctrlstr);
                      });
                    }else{
                      log.info({container : no
                               , ctrl: nctrlstr}
                              , "monitoring");
                    }
                  }); // setstate
                }) // get state[no]
              }else{
                //
                //---*--- load ---*---
                //
                if(cmd == loadstr){
                  mp.ctrl.set([no], "loading", function(){
                    load(mp, no);
                  });
                  log.info({container: no
                           , ctrl: ready}
                          , "start load");

                } // load

                //
                //---*--- run/mon ---*---
                //

                if((cmd == runstr || cmd == mon ) && timerId[mpname][no] == 0){
                  timerId[mpname][no] = setInterval(
                    function(){
                      mp.state.get([no], function(nostate){
                        walk.struct(mp, no, nostate, run);

                      });
                    }, ch)
                  log.info({container: no
                           , ctrl: ready}
                          , "start run");
                } // run/mon

                //
                //---*--- stop ---*---
                //
                if(cmd == stop){
                  clearInterval(timerId[mpname][no]);
                  timerId[mpname][no] = 0;
                  mp.state.get([no], function(nostate){
                    walk.setstate(mp, no, nostate, ready, function(){
                      mp.ctrl.set([no], ready, function(){
                        log.info({container: no
                                 , ctrl: ready}
                                , "stopped");
                      });
                    });
                  });
                } // stop

                //
                //---*--- pause ---*---
                //
                if(cmd == pause){
                  clearInterval(timerId[mpname][no]);
                  timerId[mpname][no] = 0
                  mp.ctrl.set([no], ready, function(){
                    log.info({container: no
                             , ctrl: ready}
                            , "paused");
                  });
                } // pause

                //
                //---!--- error ---!---
                //
                if(state == error && timerId[mpname][no] !== 0){
                  clearInterval(timerId[mpname][no]);
                  timerId[mpname][no] = 0;
                  mp.ctrl.set([no], ready, function(){
                    log.info({container: no,
                              ctrl: error}
                            ,"paused automatically because of error");
                  });
                }// error
              } // else executed
            }) // checkstate
          }) // each container
        }) // get ctrl
      }, sh); // intervall
  }); // meta
};
module.exports = observe;
