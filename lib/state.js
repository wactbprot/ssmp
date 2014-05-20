var _        = require("underscore"),
    bunyan   = require("bunyan"),
    gen      = require("./gen"),
    ctrl     = require("./ctrl"),
    defaults = require("./defaults").all,
    log      = bunyan.createLogger({name: defaults.appname}),
    ds       = defaults.statstr;
/**
 * Die Funktion ```observe``` beobachtet die ```ctrl```
 * Schnittstelle der ```container```. Zusätzlich wird der ```state```
 * (Zustand der Einzelnen Tasks) ausgewertet. Sind alle
 * ```state```s ```executed``` werden alle auf ```ready```
 * zurückgesetzt und der ```ctrl``` String des containers
 * ebenfalls auf ```ready``` gesetzt.
 * Reagiert wird auf:
 *
 * - load
 * - run
 * - stop
 * - pause
 */
var observe = function(mp){
  setInterval(function(){
    // alle container durchlaufen
    _.each(mp.ctrl.get(), function (cmd, no){

      var state = gen.check(mp, no);

      log.info({container:no,
                state: state}, "container: " + no +
               " has state: " + state)

      if(state === ds.exec){
        mp.state.ini([no], ds.ready, function(){
          mp.ctrl.set([no], ds.ready, function(){
            clearInterval(mp.rtimerid.get([no]));
            mp.rtimerid.set([no], 0, function(){
              mp.ctrl.set([no], ds.ready, function(){
                log.info({container:no,
                          ctrl: ds.ready}, "all executed, switch ctrl to ready");
              });
            });
          })
        });
      }else{

        if(cmd == "load" &&
           mp.rtimerid.get([no]) === 0){

          mp.ctrl.set([no], ds.load, function(){
            mp.rtimerid.set([no],
                            setInterval(function(){
                              gen.walk(mp, no, ctrl.load);
                            }, mp.param.get(["system", "heartbeat"])))
          });
        }

        if(cmd == "run" &&
           mp.rtimerid.get([no]) === 0){

          mp.ctrl.set([no], ds.run, function(){
            mp.rtimerid.set([no],
                            setInterval(function(){
                              gen.walk(mp, no, ctrl.run);
                            }, mp.param.get(["system", "heartbeat"])))
          });
        }

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
