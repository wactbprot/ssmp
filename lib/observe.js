var _        = require("underscore"),
    bunyan   = require("bunyan"),
    clone    = require("clone"),
    run      = require("./run"),
    load     = require("./load"),
    gen      = require("./generic"),
    utils    = require("./utils"),
    deflt    = require("./default"),
    log      = bunyan.createLogger({name: deflt.appname}),
    ctrlstr  = deflt.ctrlStr;

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
 * Die ```observe()``` reagiert auf:
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

  log.info({ok:true}, "start observing Mp");

  var date  = new Date(),
      stime = date.getTime();

  mp.exchange.set(["start_time", "Value", "value"], stime);
  mp.exchange.set(["start_time", "Unit", "value"], "ms");

  mp.exchange.set(["run_time", "Unit", "value"], "ms");
  var obtimer =  setInterval(function(){

    var rtime = (new Date()).getTime() - stime;

    mp.exchange.set(["run_time", "Value", "value"], rtime);

    _.each(mp.ctrl.get(), function (cmdstr, no){

      var cmdarr = utils.cmd_to_array(cmdstr),
          cmd    = _.first(cmdarr),
          state  = gen.checkstate(mp, no);

      //
      //---*--- executed ---*---
      //
      if(state === ctrlstr.exec){

        var nctrlstr  = _.rest(cmdarr).join(";")
        if(nctrlstr === ""){
          nctrlstr = ctrlstr.ready;
        }

        clearInterval(mp.timerid.get([no]));
        mp.timerid.set([no], 0, function(){
          gen.setstate(mp, no, mp.state.get([no]), ctrlstr.ready, function(){
            if(cmd !==  ctrlstr.mon){
              mp.ctrl.set([no], nctrlstr, function(){
                log.info({container : no,
                          ctrl      : nctrlstr},
                         "all executed, switch ctrl to: " + nctrlstr);
              });
            }else{
              log.info({container : no,
                        ctrl      : nctrlstr},
                       "monitoring");
            }
          });
        });

      }else{

        //
        //---*--- load ---*---
        //
        if(cmd == ctrlstr.load && mp.timerid.get([no]) === 0){
          log.info({ok:true}, "observer received load for container: " + no)
          mp.timerid.set([no], setInterval(function(){
                                 gen.walkstate(mp, no, load);
                               }, mp.param.get(["container", "heartbeat"])))

        } // load

        //
        //---*--- run/mon ---*---
        //
        if((cmd == ctrlstr.run || cmd == ctrlstr.mon ) && mp.timerid.get([no]) === 0){
          mp.timerid.set([no], setInterval(function(){
                                 gen.walkstate(mp, no, run);
                               }, mp.param.get(["container", "heartbeat"])))
        } // run/mon

        //
        //---*--- stop ---*---
        //
        if(cmd == ctrlstr.stop){
          clearInterval(mp.timerid.get([no]));
          mp.timerid.set([no], 0, function(){
            gen.setstate(mp, no, mp.state.get([no]), ctrlstr.ready, function(){
              mp.ctrl.set([no], ctrlstr.ready, function(){
                log.info({container: no,
                          ctrl: ctrlstr.ready}, "stopped");
              });
            });
          });
        } // stop

        //
        //---*--- pause ---*---
        //
        if(cmd == ctrlstr.pause){

          clearInterval(mp.timerid.get([no]));
          mp.timerid.set([no], 0, function(){
            mp.ctrl.set([no], ctrlstr.ready, function(){
              log.info({container: no,
                        ctrl: ctrlstr.ready}, "paused");
            });
          });
        } // pause

        //
        //---!--- error ---!---
        //
        if(state === ctrlstr.error && mp.timerid.get([no]) !== 0){
          clearInterval(mp.timerid.get([no]));
          mp.timerid.set([no], 0, function(){
            mp.ctrl.set([no], ctrlstr.ready, function(){
              log.info({container: no,
                        ctrl: ctrlstr.error}, "paused automatically because of error");
            });
          });
        }
      } // else executed
    }); // each container
  }, mp.param.get(["system", "heartbeat"]));
  mp.obtimer.set([],obtimer, log.info({ok:true}, "stored observe timer"))
};
module.exports = observe;