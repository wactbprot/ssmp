var name     = "ssmp",
    _        = require("underscore"),
    bunyan   = require("bunyan"),
    net      = require("./net"),
    deflt    = require("./default"),
    request  = require("./request"),
    log      = bunyan.createLogger({name: deflt.appname}),
    ctrlstr  = deflt.ctrlStr;


/**
 * ```load()``` läd die _task_ und sendet die
 * Replacements (wenn vorhanden) im POST body.
 *
 * Bevor irgendwas geschieht wird der
 * ```state``` erstmal auf ```working```
 * gesetzen; alles Weitere geschieht
 * als callback des ```state```-setters.
 *
 * ```load()``` ist auch
 * reload; in diesem Fall
 * ist _task_ ein schon die
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
 * Damit dass nicht zu kompliziert wird
 * soll nur eine CUCO-Task (read, write ...)
 * pro seriellem Schritt erlaubt sein.
 *
 * @param {Object} mp Messprog.-Objekt
 * @param {Array} path Pfad Array
 */
var load = function(mp, path){

  mp.state.get(path, function(state){
    mp.id.get([], function(calibobjs){

      var  calibids   = _.keys(calibobjs); // calibration doc ids

      log.info({ok:true, fn: "load"}
              , "try to load path: "
              + JSON.stringify(path))

      if(state === ctrlstr.ready){

        mp.state.set(path, ctrlstr.work, function(){
          mp.definition.get(path, function(taskdef){
            mp.name.get([], function(mpname){
              var l1,
                  protask   = {},
                  npath     = path,
                  taskname  = taskdef.TaskName;
              protask.MpName = mpname;
              if(!_.isUndefined(taskdef.Replace)){
                protask.Replace  = taskdef.Replace;
              }
              if(!_.isUndefined(taskdef.Use)){
                protask.Use  = taskdef.Use;
              }
              if(taskname.search(deflt.cucoRE) === 0){
                var noOfCalibs = calibids.length;
                if(noOfCalibs > 0){
                  for(var i = 0; i < noOfCalibs; i++){
                    var calibid    = calibids[i],
                        calibobj   = calibobjs[calibid],
                        devicename = "CustomerDevice_" + i;
                    if(calibobj.Device &&
                       _.isString(calibobj.Device)){
                      devicename  = calibobj.Device.replace(/\s/g, "_");
                    }
                    if(i > 0){
                      var f2 = _.first(path, 2);
                      l1     = mp.definition.get(f2).length;
                      npath  = [f2[0], f2[1], l1];
                    }
                    protask.Id         = [calibid];
                    protask.CuCo       = true;
                    protask.DeviceName = devicename;
                    protask.TaskName   = taskname.replace(deflt.cucoRE, devicename +"-");
                    log.info({ok:true}
                            , "replaced CuCo by "
                            + devicename)
                    mp.state.set(npath, ctrlstr.ready, function(){
                      mp.recipe.set(npath, protask, function(){
                        fetchtask(mp, npath);
                      });
                    });
                  } //for calibration ids
                }else{
                  // coco task aber kein calibration docs
                  protask.Id         = [];
                  protask.CuCo       = true;
                  protask.DeviceName = "CustomerDevice";
                  protask.TaskName   = taskname.replace(deflt.cucoRE, mpname +"-");
                  log.info({ok:true}
                          , "replaced CuCo by "
                          + mpname)
                  mp.state.set(path, ctrlstr.ready, function(){
                    mp.recipe.set(path, protask, function(){
                      fetchtask(mp, path);
                    });
                  });
                }
              }else{
                protask.TaskName = taskdef.TaskName
                protask.Id       = calibids;
                protask.CuCo     = false;
                mp.state.set(path, ctrlstr.ready, function(){
                  mp.recipe.set(path, protask, function(){
                    fetchtask(mp, path);
                  });
                });
              }
            }); // get mpname
          }); // get taskdef
        }); // set work
      } // if ready

    }) // get id
  }) // get state
};
module.exports = load;

var fetchtask = function(mp, path){

  mp.recipe.get(path, function(task){
    var    con      = net.task(mp),
        taskname = task.TaskName;

    log.info({ok:true}
            ,"try to load: "
            + taskname);
    // (mp, con, task, path, wrtdata, cb)
    request.exec(mp, con, task, path, JSON.stringify(task)
                , function(task){
                    log.info({ok:true}
                            , "received task: "
                            + task.TaskName
                            + " try to set recipe")

                    mp.recipe.set(path, task, function(res){
                      if(res.ok){
                        mp.state.set(path, ctrlstr.exec, function(res){
                          if(res.ok){
                            log.info({ok:true}
                                    ,"task: "
                                    + task.TaskName
                                    +" loaded and replaced")
                          }
                          if(res.error){
                            log.error({error: "task state"}
                                     ,"on try to set state for task")
                          }
                        });
                      }
                      if(res.error){
                        log.error({error: "task to recipe"}
                                 ,"on try to set task to recipe")
                      }
                    }); // set recipe
                  }); // request
  }); // get task
}
