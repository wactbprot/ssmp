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
 *
 */
module.exports = function(mp){

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
                           mp.ctrl.set([no], nctrlstr, function(){
                             log.info({container:no,
                                       ctrl: nctrlstr},
                                      "all executed, switch ctrl to: " + nctrlstr);
                           });
                         });
                       });

                     }else{

                       //
                       //---*--- load ---*---
                       //
                       if(cmd == ctrlstr.load && mp.timerid.get([no]) === 0){
                         mp.timerid.set([no], setInterval(function(){
                                                gen.walkstate(mp, no, load);
                                              }, mp.param.get(["container", "heartbeat"])))

                       } // load

                       //
                       //---*--- run ---*---
                       //
                       if(cmd == ctrlstr.run && mp.timerid.get([no]) === 0){
                         mp.timerid.set([no], setInterval(function(){
                                                gen.walkstate(mp, no, run);
                                              }, mp.param.get(["container", "heartbeat"])))
                       } // run

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
