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
      if(!_.isUndefined(taskdef.Use)){
        protask.Use  = taskdef.Use;
      }

      if(taskname.search(deflt.cucoRE) === 0){
        if(cid.length > 0){
          for(var i = 0; i < cid.length; i++){
            var repldev  = cobj[cid[i]].Device.replace(/\s/g, "_");
            if(i > 0){
              var f2 = _.first(path, 2);
                  //l1 = mp.state.get(f2).length;
              l1 = mp.definition.get(f2).length;
              npath  = [f2[0], f2[1], l1];
            }

            protask.Id         = [cid[i]];
            protask.CuCo       = true;
            protask.DeviceName = repldev;
            protask.TaskName   = taskname.replace(deflt.cucoRE, repldev +"-");

            log.info({ok:true}, "replaced CuCo by " + repldev)

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
          protask.TaskName   = taskname.replace(deflt.cucoRE, mp.name.get([]) +"-");

          log.info({ok:true}, "replaced CuCo by " + mp.name.get([]))

          mp.state.set(path, ctrlstr.ready, function(){
            mp.recipe.set(path, protask, function(){
              fetchtask(mp, path);
            });
          });
        }
      }else{

        protask.TaskName = taskdef.TaskName
        protask.Id       = cid;
        protask.CuCo     = false;

        mp.state.set(path, ctrlstr.ready, function(){
          mp.recipe.set(path, protask, function(){
            fetchtask(mp, path);
          });
        });
      }
    }); // set work
  } // if ready
};
module.exports = load;

var fetchtask = function(mp, path){
console.log("fetch" );
console.log(path)
  var task     = mp.recipe.get(path),
      con      = net.task(mp),
      taskname = task.TaskName,
      wrtdata  = JSON.stringify(task);
//var exec = function(mp,  task, path, con,  wrtdata, passdata, cb){
  log.info({ok:true}, "try loading " + taskname)
  request.exec(mp,  task, path, con, wrtdata, false, function(){
    log.info({ok:true}, "task "+ taskname + "loaded")
  })




//  net.dbcon(mp).relax(opts, function(err, task){
//
//    if(_.isObject(task)){ // task ok
//      if(task.error){
//        log.error(task,"can not load task")
//      }else{
//        mp.recipe.set(path, task, function(){
//          mp.state.set(path, ctrlstr.exec, function(){
//            log.info(task, "loaded and replaced")
//          });
//        });
//      }
//    }else{ // task not ok
//         mp.state.set(path, ctrlstr.missing, function(){
//           log.error({error:"not_found"},
//                     "no task called " + taskname)
//         });
//       } // no task
//    if(err){
//      log.error({error:"request failed"}, err)
//       }
//  }); // view: get tasks by name
}
