var _        = require("underscore"),
    bunyan   = require("bunyan"),
    gen      = require("./gen"),
    op     = require("./op"),
    defaults = require("./defaults").all,
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

      var state = gen.check(mp, no);

      log.debug({container:no,
                 state: state}, "container: " + no +
                " has state: " + state)

      /**
       * ---*--- executed ---*---
       *
       * globaler status ist ```executed```
       * - zurücksetzen auf ```ready```
       * - löschen der timer
       */
      if(state === ds.exec){
        mp.state.ini([no], ds.ready, 2, function(){
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
         */
        if(cmd == "load" &&
           mp.rtimerid.get([no]) === 0){
          mp.ctrl.set([no], ds.load, function(){
            mp.rtimerid.set([no],
                            setInterval(function(){
                              gen.walk(mp, no, op.load);
                            }, mp.param.get(["container", "heartbeat"])))
          });
        }

        /**
         * ---*--- run ---*---
         */
        if(cmd == "run" &&
           mp.rtimerid.get([no]) === 0){

          mp.ctrl.set([no], ds.run, function(){
            mp.rtimerid.set([no],
                            setInterval(function(){
                              gen.walk(mp, no, op.run);
                            }, mp.param.get(["container", "heartbeat"])))
          });
        }

        /**
         * ---*--- stop ---*---
         */
        if(cmd == "stop"){
          mp.ctrl.set([no], ds.stop, function(){
            clearInterval(mp.rtimerid.get([no]));
            mp.rtimerid.set([no], 0, function(){
              mp.ctrl.set([no], ds.ready, function(){
                log.info({container:no,
                          ctrl: ds.ready}, "stoped");
              });
            });
          });
        }

        /**
         * ---*--- pause ---*---
         */
        if(cmd == "pause"){
          clearInterval(mp.rtimerid.get([no]));
          mp.rtimerid.set([no], 0, function(){
            mp.ctrl.set([no], ds.ready, function(){
              log.info({container:no,
                        ctrl: ds.ready}, "paused");
            });
          });
        }
      }
    })
  }, mp.param.get(["system", "heartbeat"]));
};
exports.observe = observe;
