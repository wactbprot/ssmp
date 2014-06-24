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
    utils  = require("./oputils"),
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

      protask.MpName = mp.name.get([]);

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
                utils.fetchtask(mp, npath);
              });
            });
          } //for calibration ids
        }else{
          // coco task aber kein calibration docs
          protask.Id         = [];
          protask.CuCo       = true;
          protask.DeviceName = "CustomerDevice";
          protask.TaskName   = taskname.replace(deflt.cucoRE, mp.name.get([]) +"-");

          log.info({ok:true}, "replaced CuCo by " + mp.name.get([]))

          mp.state.set(path, ctrlstr.ready, function(){
            mp.recipe.set(path, protask, function(){
              utils.fetchtask(mp, path);
            });
          });
        }
      }else{

        protask.TaskName = taskdef.TaskName
        protask.Id       = cid;
        protask.CuCo     = false;
        mp.state.set(path, ctrlstr.ready, function(){
            mp.recipe.set(path, protask, function(){
              utils.fetchtask(mp, path);
            });
        });
      }
    }); // set work
  } // if ready
};
exports.load = load;

/**
 *  * --*-- run --*--
 * Die Funktion ```run()```  erledigt folgende Aufgaben:
 *
 * * wählt die richtige  ```worker```-Funktion aus und stellt den
 *    callback zur Verfügung
 * * RunIf und StopIf werden entschieden
 * * es werden die Laufzeitersetzungen vorgenommen
 *  (Bsp.: der String für den MKS-Flow Kontroller)
 */
var run  = function(mp, path){
  var state = mp.state.get(path);

  if(state === ctrlstr.ready){
    mp.state.set(path, ctrlstr.work, function(){
      var task = mp.recipe.get(path);

      if(_.isObject(task)         &&
         task.Action              &&
         _.isFunction(worker[task.Action])){

        var exec   = task.Action,
            ok     = true,
            cmdstr = ctrlstr.exec,
            tsknm  = task.TaskName,
            oktxt  = "task " + tsknm + " executed",
            errtxt = "task " + tsknm + " task execution failed";

        // --- Runtime data exchange
        if(task.FromExchange){
          if(_.isArray(task.FromExchange)){

            for( var l = 0; l < task.FromExchange.length; l++){
              var epath = task.FromExchange[l].split("."),
                  token = task.FromExchange[l],
                  value = mp.exchange.get(epath);

              if(token && value){
                task =  utils.repltask(task, token , value );
              }else{
                ok = false;
              }
            }
          }else{
            var epath = task.FromExchange.split("."),
                token = task.FromExchange,
                value = mp.exchange.get(epath);

            if(token && value){
              task =  utils.repltask(task, token , value );
            }else{
              ok = false;
            }
          }
        } // Exchange

        // --- StopIf
        if(task.StopIf){
          if(mp.exchange.get(task.StopIf.split(".")) == "true"){
            ok = false;
            cmdstr = ctrlstr.exec;
            oktxt = "task " + tsknm + " ends";
          }else{
            ok = true;
            cmdstr = ctrlstr.ready;
            oktxt = "task " + tsknm + " waiting for task.StopIf to become true";
          }
        } // StopIf

        // --- RunIf
        if(task.RunIf){
          if(mp.exchange.get(task.RunIf.split(".")) == "true"){
            ok = true;
            cmdstr = ctrlstr.exec;
            oktxt = "task " + tsknm + " started";
          }else{
            ok = false;
            cmdstr = ctrlstr.ready;
            oktxt = "task " + tsknm + " awaiting data from exchange";
          }
        }// RunIf

        // --- worker[exec]
        if(ok){
          worker[exec](mp, task, path, function(res){
            if(res === "ok"){
              mp.state.set(path, cmdstr, function(){
                log.info(oktxt)
              })
            } // return ok
            if(res === "error"){
              mp.state.set(path, cmdstr, function(){
                log.error(errtxt)
              })
              } // return with error
          });
        }else{
          mp.state.set(path, cmdstr, function(){
            log.info(oktxt)
          })
        }// worker[exec]


      }else{// task is obj
        mp.state.set(path, ctrlstr.error, function(){
          log.error(task, "task don't work (most likely unknown Action)")
        });
      }
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
        utils.buildup(mp, doc, cb);
      }
    });
  }

  if(typeof rb === "object"){
    log.info({ok:true},"received mp definition by post request")
    utils.buildup(mp, rb, cb);
  }
  if(id === sim){
    log.info({ok:true},"request the md simulation")
    utils.buildup(mp, simjs, cb);
  }
}
exports.ini = ini;
