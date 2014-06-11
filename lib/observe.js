var _        = require("underscore"),
    bunyan   = require("bunyan"),
    clone    = require("clone"),
    gen      = require("./generic"),
    op       = require("./operation"),
    defaults = require("./default"),
    log      = bunyan.createLogger({name: defaults.appname}),
    ds       = defaults.statstr;

/**
 * Die Funktion ```observe``` beobachtet die ```ctrl```
 * Schnittstelle der ```container```.
 *
 * Zusätzlich wird der ```state``` (Zustand der
 * einzelnen Tasks) ausgewertet. Sind alle
 * ```state```s ```executed``` werden alle
 * auf ```ready``` zurückgesetzt und
 * der ```ctrl``` String des containers ebenfalls
 * auf ```ready``` gesetzt.  Reagiert wird auf:
 *
 * - load
 * - run
 * - stop
 * - pause
 *
 * todo:
 *
 * und Komma separierte Aufzählungen wie:
 * - load,run,stop
 */
var observe = function(mp){
 // implement: load,run,stop

  setInterval(function(){
    _.each(mp.ctrl.get(), function (cmd, no){

      var state = gen.check(mp, no);

      /**
       * ---*--- executed ---*---
       */
      if(state === ds.exec){

        mp.state.ini([no], ds.ready, 2, function(){
          mp.ctrl.set([no], ds.ready, function(){
            clearInterval(mp.timerid.get([no]));
            mp.timerid.set([no], 0, function(){
              mp.ctrl.set([no], ds.ready, function(){
                log.info({container:no,
                          ctrl: ds.ready},
                         "all executed, switch ctrl to ready");
              });
            });
          })
        });

      }else{

        /**
         * ---*--- load ---*---
         *
         * Da das Ergebnis der Ladens von der Anzahl der
         * Kalibrierungen abhängt, muss immer von vorn
         * begonnen werden:
         *
         * * recepies zurücksetzen^)
         * * state  zurücksetzen^)
         * * state mit ready initialisieren^)
         * * starten des Ladens
         * ^) nur beim 1. Aufruf
         */
        if(cmd == "load" && mp.timerid.get([no]) === 0){
          var clr = true;
          mp.ctrl.set([no], ds.load, function(){
            mp.timerid.set([no], setInterval(function(){
                                    if(clr){
                                      clr = false;
                                      var inistruct = mp.definition.get([no]);
                                      console.log(inistruct)
                                      mp.recipe.set([no], clone(inistruct), function(){
                                        mp.state.set([no], clone(inistruct), function(){
                                          mp.state.ini([no], ds.ready, 1, function(){
                                            log.info({ok:true}, "refesh state & recipe");
                                            gen.walk(mp, no, op.load);
                                          });
                                        });
                                      });
                                    }else{
                                      gen.walk(mp, no, op.load);
                                    }
                                  }, mp.param.get(["container", "heartbeat"])))
          });
        } // load

        /**
         * ---*--- run ---*---
         */
        if(cmd == "run" && mp.timerid.get([no]) === 0){

          mp.ctrl.set([no], ds.run, function(){
            mp.timerid.set([no], setInterval(function(){
                                    gen.walk(mp, no, op.run);
                                  }, mp.param.get(["container", "heartbeat"])))
          });
        } // run

        /**
         * ---*--- stop ---*---
         */
        if(cmd == "stop"){

          mp.ctrl.set([no], ds.stop, function(){
            clearInterval(mp.timerid.get([no]));
            mp.timerid.set([no], 0, function(){
              mp.state.ini([no], ds.ready, 2, function(){
                mp.ctrl.set([no], ds.ready, function(){
                  log.info({container: no,
                            ctrl: ds.ready}, "stopped");
                });
              });
            });
          });
        } // stop

        /**
         * ---*--- pause ---*---
         */
        if(cmd == "pause"){

          clearInterval(mp.timerid.get([no]));
          mp.timerid.set([no], 0, function(){
            mp.ctrl.set([no], ds.ready, function(){
              log.info({container: no,
                        ctrl: ds.ready}, "paused");
            });
          });
        } // pause

      } // else executed
    }); // each container
  }, mp.param.get(["system", "heartbeat"]));
};
module.exports = observe;
