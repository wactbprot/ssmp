var _        = require("underscore"),
    bunyan   = require("bunyan"),
    clone    = require("clone"),
    gen      = require("./generic"),
    op       = require("./operation"),
    deflt    = require("./default"),
    log      = bunyan.createLogger({name: deflt.appname}),
    ctrlstr  = deflt.ctrlStr;

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
      if(state === ctrlstr.exec && cmd !== ctrlstr.load){

        mp.state.ini([no], ctrlstr.ready, 2, function(){
          mp.ctrl.set([no], ctrlstr.ready, function(){
            clearInterval(mp.timerid.get([no]));
            mp.timerid.set([no], 0, function(){
              mp.ctrl.set([no], ctrlstr.ready, function(){
                log.info({container:no,
                          ctrl: ctrlstr.ready},
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
        if(cmd == ctrlstr.load && mp.timerid.get([no]) === 0){
          var clr = true;
          mp.ctrl.set([no], "loading", function(){
            mp.timerid.set([no], setInterval(function(){
                                   if(clr){
                                     clr = false;
                                      var inistruct = mp.definition.get([no]);
                                     mp.recipe.set([no], clone(inistruct), function(){
                                       mp.state.set([no], clone(inistruct), function(){
                                         mp.state.ini([no], ctrlstr.ready, 1, function(){
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
        if(cmd == ctrlstr.run && mp.timerid.get([no]) === 0){

          mp.ctrl.set([no], "running", function(){
            mp.timerid.set([no], setInterval(function(){
                                   gen.walk(mp, no, op.run);
                                 }, mp.param.get(["container", "heartbeat"])))
          });
        } // run

        /**
         * ---*--- stop ---*---
         */
        if(cmd == ctrlstr.stop){

          mp.ctrl.set([no], "stopping", function(){
            clearInterval(mp.timerid.get([no]));
            mp.timerid.set([no], 0, function(){
              mp.state.ini([no], ctrlstr.ready, 2, function(){
                mp.ctrl.set([no], ctrlstr.ready, function(){
                  log.info({container: no,
                            ctrl: ctrlstr.ready}, "stopped");
                });
              });
            });
          });
        } // stop

        /**
         * ---*--- pause ---*---
         */
        if(cmd == ctrlstr.pause){
          mp.ctrl.set([no], "pausing", function(){
            clearInterval(mp.timerid.get([no]));
            mp.timerid.set([no], 0, function(){
              mp.ctrl.set([no], ctrlstr.ready, function(){
                log.info({container: no,
                          ctrl: ctrlstr.ready}, "paused");
              });
            });
          });
        } // pause

        /**
         * ---!--- error ---!---
         */
        if(state === ctrlstr.error && mp.timerid.get([no]) !== 0){

          mp.ctrl.set([no], "pausing", function(){
            clearInterval(mp.timerid.get([no]));
            mp.timerid.set([no], 0, function(){
              mp.ctrl.set([no], ctrlstr.ready, function(){
                log.info({container: no,
                          ctrl: ctrlstr.error}, "paused automatically because of error");
              });
            });
          });
        }



      } // else executed
    }); // each container
  }, mp.param.get(["system", "heartbeat"]));
};
module.exports = observe;
