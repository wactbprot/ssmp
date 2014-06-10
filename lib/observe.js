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
 */
var observe = function(mp){

  setInterval(function(){
    _.each(mp.ctrl.get(), function (cmd, no){

      var state = gen.checkState(mp, no);

      /**
       * ---*--- initialize ---*---
       */
      if(state === ds.ini){
        gen.iniState(mp, no, ds.ready);
        log.info({ok:true}, "container: " + no +
                 " has state: " + state)
      }
      /**
       * ---*--- executed ---*---
       */
      if(state === ds.exec){

        gen.iniState(mp, no, ds.ready, function(){
          mp.ctrl.set([no], ds.ready, function(){
            clearInterval(mp.rtimerid.get([no]));
            mp.rtimerid.set([no], 0, function(){
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
        if(cmd == "load" && mp.rtimerid.get([no]) === 0){
          var clr = true;
          log.info({ok:true}, "receive load cmd on container " + no);
          mp.ctrl.set([no], ds.load, function(){
            mp.rtimerid.set([no], setInterval(function(){
                                    if(clr){
                                      clr = false;
                                      var inistruct = mp.definition.get([no]);
                                      mp.recipe.set([no], clone(inistruct), function(){
                                        gen.iniState(mp, [no], ds.ready, function(){
                                          log.info({ok:true}, "refesh state & recipe");
                                          gen.walk(mp, no, op.load);
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
        if(cmd == "run" && mp.rtimerid.get([no]) === 0){

          mp.ctrl.set([no], ds.run, function(){
            mp.rtimerid.set([no], setInterval(function(){
                                    gen.walk(mp, no, op.run);
                                  }, mp.param.get(["container", "heartbeat"])))
          });
        } // run

        /**
         * ---*--- stop ---*---
         */
        if(cmd == "stop"){

          mp.ctrl.set([no], ds.stop, function(){
            clearInterval(mp.rtimerid.get([no]));
            mp.rtimerid.set([no], 0, function(){
              gen.iniState([no], ds.ready, function(){
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

          clearInterval(mp.rtimerid.get([no]));
          mp.rtimerid.set([no], 0, function(){
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
