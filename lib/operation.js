/**
 * op.js contains functions for ssmp
 * operations like
 *
 * -ini
 * -load
 * -run
 */

var name     = "ssmp",
    _        = require("underscore"),
    bunyan   = require("bunyan"),
    nano     = require("nano"),
    clone    = require("clone"),
    net      = require("./net"),
    gen      = require("./generic"),
    deflt    = require("./default"),
    worker   = require("./worker"),
    simjs    = require("./simdef"),
    oputils  = require("./oputils"),
    log      = bunyan.createLogger({name: deflt.appname}),
    ctrlstr  = deflt.ctrlStr;

/**
 * --*-- load --*--
 *
 * ```load()``` läd die Task und sendet die
 * Replacements (wenn vorhanden) im POST body.
 *
 * Bevor irgendwas geschieht wird der
 * ```state``` erstmal auf ```working```
 * gesetzen; alles weitere geschieht
 * als callback des state setters
 *
 * ```load()``` ist auch
 * reload; in diesem Fall
 * ist task ein schon die
 * eigentliche task
 * (und keine Ersetzungsvorschrift)
 *
 * Beginnt der Taskname mit ```CUCO``
 * (CUCO ... customer calibration object)
 * wird der String ```CUCO`` noch durch
 * die etsprechenden Gerätenamen ersetzt.
 *
 * Wenn mehr als eine Kalib.
 * geladen ist, muss zu ```state``` und ```recipe```
 * noch eine Position (am Ende) dazukommen
 * um die Kunden-Tasks aufzunehmen.
 *
 */
var load  = function(mp, path){

  var state    = mp.state.get(path),
      cobj     = mp.id.get(),
      cid      = _.keys(cobj); // calibration doc ids

  if(state === ctrlstr.ready){

    mp.state.set(path, ctrlstr.work, function(){
      var l1,
          protask   = {},
          npath     = path,
          taskdef   = mp.definition.get(path),
          taskname  = taskdef.TaskName;

      protask.MpName = mp.Name;

      if(!_.isUndefined(taskdef.Replace)){
        protask.Replace  = taskdef.Replace;
      }

      if(taskname.search(deflt.cucoRE) === 0){
        if(cid.length > 0){
          for(var i = 0; i < cid.length; i++){
            var repldev  = cobj[cid[i]].Device.replace(/\s/g, "_");
            if(i > 0){
              var f2 = _.first(path, 2);
                  l1 = mp.state.get(f2).length;
              npath  = [f2[0], f2[1], l1];
            }

            protask.Id         = [cid[i]];
            protask.CuCo       = true;
            protask.DeviceName = repldev;
            protask.TaskName   = taskname.replace(deflt.cucoRE, repldev +"-");

            log.info({ok:true}, "replaced CuCo by " + repldev)

            mp.state.set(npath, ctrlstr.ready, function(){
              mp.recipe.set(npath, protask, function(){
                oputils.fetchtask(mp, npath);
              });
            });
          } //for calibration ids
        }else{
          // coco task aber kein calibration docs
          protask.Id         = [];
          protask.CuCo       = true;
          protask.DeviceName = "CustomerDevice";
          protask.TaskName   = taskname.replace(deflt.cucoRE, mp.Name +"-");

          log.info({ok:true}, "replaced CuCo by " + mp.Name)

          mp.state.set(path, ctrlstr.ready, function(){
            mp.recipe.set(path, protask, function(){
              oputils.fetchtask(mp, path);
            });
          });
        }
      }else{

        protask.TaskName = taskdef.TaskName
        protask.Id       = cid;
        protask.CuCo     = false;
        mp.state.set(path, ctrlstr.ready, function(){
            mp.recipe.set(path, protask, function(){
              oputils.fetchtask(mp, path);
            });
        });
      }
    }); // set work
  } // if ready
};
exports.load = load;

/**
 *  * --*-- run --*--
 *
 * ```run()``` wählt die richtige
 * ```worker```-Funktion aus und stellt den
 * callback zur Verfügung
 */
var run  = function(mp, path){
  var state = mp.state.get(path),
      ok    = true;
  if(state === ctrlstr.ready){
    mp.state.set(path, ctrlstr.work, function(){
      var task = mp.recipe.get(path);

      if(_.isObject(task) && task.Action){

        // RunIf und StopIf können
        // hier schon abgefeiert werden
        // weiter:
        // auch Laufzeitwerte
        // (Bsp.: der String für den MKS-Flow Kontroller)
        // kann man hier einbauen
        if(task.Exchange){
          if(_.isArray(task.Exchange)){

            for( var l = 0; l < task.Exchange.length; l++){
              var epath = task.Exchange[l].split(".")

              var token = task.Exchange[l],
                  value = mp.exchange.get(epath);

              if(token && value){
                task =  oputils.repltask(task, token , value );
              }else{
                ok = false;
              }
            }
          }else{
            var epath = task.Exchange.split(".")
            var token = task.Exchange,
                value = mp.exchange.get(epath);

            if(token && value){
              task =  oputils.repltask(task, token , value );
            }else{
              ok = false;
            }
          }
        } // Exchange

        if(task.StopIf){
          if(mp.exchange.get(task.StopIf.split("."))){
            ok = false;
          }else{
            ok = true;
          }
        }
        if(task.RunIf){
          if(mp.exchange.get(task.RunIf.split("."))){
            ok = true;
          }else{
            ok = false;
          }
        }

        var exec = task.Action;
        if(_.isFunction(worker[exec])){

          // ------------------------------------------------- //
          if(ok){
            worker[exec](mp, task, path, function(res){
              if(res === "ok"){
                mp.state.set(path, ctrlstr.exec, function(){
                  log.info("task " + task.TaskName + " executed")
                })
              } // return ok
              if(res === "error"){
                mp.state.set(path, ctrlstr.error, function(){
                  log.error(task, "task execution failed")
                })
              } // return with error
            });
          }else{
            mp.state.set(path, ctrlstr.ready, function(){
              log.info("task " + task.TaskName + " awaiting data from exchange")
            })
          }
            // ------------------------------------------------- //
        }else{
          mp.state.set(path, ctrlstr.error, function(){
            log.error(task, "unknown action " + exec)
          })
        }
      }// task is obj
    }); // working
  } // ready
};
exports.run = run;

/**
 * --*-- ini --*--
 *
 * ```mpid``` ist die ```id``` des Messprogrammdokuments
 * bzw. der Messprogrammdefinition im POST-Body
 */
var ini = function(mps, req, cb){
  var id    = req.params.id,
      rb    = req.body,
      sim   = "sim";

  mps[id]  = {};
  var mp   = mps[id];
  mp.param = gen.mod(deflt);

  req.log.info({ok: true}, "Mp id received");

  if(id !== sim && typeof rb === "string" && rb === ctrlstr.load){
    if(mps.hasOwnProperty(id)){
      log.info({ok:true},"already initialized, try again")
    }
    net.doc(mp).get(id, function(error, doc){
      if(error){
        log.error({error:error}, "failed to load mp definition");
      }
      if(doc){
        log.info({ok:true}, "try to build mp");
        oputils.build(mp, doc, cb);
      }
    });
  }

  if(typeof rb === "object"){
    log.info({ok:true},"received mp definition by post request")
    oputils.build(mp, rb, cb);
  }
  if(id === sim){
    log.info({ok:true},"request the md simulation")
    oputils.build(mp, simjs, cb);
  }


}
exports.ini = ini;
