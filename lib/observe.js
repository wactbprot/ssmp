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
  // implement: load;run;stop

  setInterval(function(){
    _.each(mp.ctrl.get(), function (cmdstr, no){

      var cmdarr = cmdstrtoarray(cmdstr),
          cmd    = _.first(cmdarr),
          state  = gen.checkstate(mp, no);

      /**
       * ---*--- executed ---*---
       */
      if(state === ctrlstr.exec){

        var nctrlstr  = _.rest(cmdarr).join(";")
        clearInterval(mp.timerid.get([no]));
        mp.timerid.set([no], 0, function(){
          gen.setstate(mp, no,mp.state.get([no]), ctrlstr.ready, function(){
            mp.ctrl.set([no], nctrlstr, function(){
              log.info({container:no,
                        ctrl: ctrlstr.ready},
                       "all executed, switch ctrl to ready");
            });
          });
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
          mp.timerid.set([no], setInterval(function(){
                                 if(clr){
                                   clr = false;
                                   var inistruct = mp.definition.get([no]);
                                   mp.recipe.set([no], clone(inistruct), function(){
                                     gen.setstate(mp, no, clone(inistruct), ctrlstr.ready, function(){
                                       log.info({ok:true}, "refesh state & recipe");
                                       gen.walkstate(mp, no, op.load);
                                     });
                                   });
                                 }else{
                                   gen.walkstate(mp, no, op.load);
                                 }
                               }, mp.param.get(["container", "heartbeat"])))

        } // load

        /**
         * ---*--- run ---*---
         */
        if(cmd == ctrlstr.run && mp.timerid.get([no]) === 0){
          mp.timerid.set([no], setInterval(function(){
                                 gen.walkstate(mp, no, op.run);
                               }, mp.param.get(["container", "heartbeat"])))

        } // run

        /**
         * ---*--- stop ---*---
         */
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

        /**
         * ---*--- pause ---*---
         */
        if(cmd == ctrlstr.pause){

          clearInterval(mp.timerid.get([no]));
          mp.timerid.set([no], 0, function(){
            mp.ctrl.set([no], ctrlstr.ready, function(){
              log.info({container: no,
                        ctrl: ctrlstr.ready}, "paused");
            });
          });
        } // pause

        /**
         * ---!--- error ---!---
         */
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
};
module.exports = observe;

/**
 * wenn der cmdstr kann so aussieht
 *
 * load;run;stop
 *
 * soll das rauskommen:
 *
 * ["load","run", "stop"]
 *
 * wenn der cmdstr kann so aussieht
 *
 * load;2:run,stop
 *
 * soll das rauskommen:
 *
 * ["load","run", "stop","run", "stop"]
 */

var cmdstrtoarray = function(cmdstr){
  var arr = [],
      al1 = cmdstr.split(";");
  for(var i = 0; i < al1.length; i++){
    var al2 = al1[i].split(":");

    if(al2.length > 1){
      var rep    = parseInt(al2[0],10);

      if(typeof rep === "number"){
        for(var j = 0; j < rep; j++){
          _.map(al2[1].split(","), function(c){arr.push(c)});
        }
      }

    }else{
      arr.push(al1[i])
    }
  }
  if(_.isEmpty(arr)){
    arr.push(ctrlstr.ready);
  }
  return arr;
}
