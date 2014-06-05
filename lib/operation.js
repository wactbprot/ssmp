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
    d        = require("./default"),
    worker   = require("./worker"),
    log      = bunyan.createLogger({name: d.appname}),
    ds       = d.statstr;

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

  if(state === ds.ready){

    mp.state.set(path, ds.work, function(){
      var l1,
          protask   = {},
          npath     = path,
          taskdef   = mp.definition.get(path),
          taskname  = taskdef.TaskName;

      protask.MpName = mp.Name;

      if(!_.isUndefined(taskdef.Replace)){
        protask.Replace  = taskdef.Replace;
      }

      if(taskname.search(d.cucoRE) === 0){
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
            protask.TaskName   = taskname.replace(d.cucoRE, repldev +"-");

            log.info({ok:true}, "replaced CuCo by " + repldev)

            mp.state.set(npath, ds.ready, function(){
              mp.recipe.set(npath, protask, function(){
                fetchtask(mp, npath);
              });
            });
          } //for calibration ids
        }else{
          // coco task aber kein calibration docs
          protask.Id         = [];
          protask.CuCo       = true;
          protask.TaskName   = taskname.replace(d.cucoRE, mp.Name +"-");

          log.info({ok:true}, "replaced CuCo by " + mp.Name)

          mp.state.set(path, ds.ready, function(){
            mp.recipe.set(path, protask, function(){
              fetchtask(mp, path);
            });
          });
        }
      }else{

        protask.TaskName = taskdef.TaskName
        protask.Id       = cid;
        protask.CuCo     = false;
        mp.state.set(path, ds.ready, function(){
            mp.recipe.set(path, protask, function(){
              fetchtask(mp, path);
            });
        });
      }
    }); // set work
  } // if ready
};
exports.load = load;

var fetchtask = function(mp, path){

  var task     = mp.recipe.get(path),
      opts     = net.task(mp),
      taskname =  task.TaskName;

  opts.body    = task; // immer alles mitschicken
  opts.method  = "POST";

  log.info({ok:true}, "try loading " + taskname)
  net.dbcon(mp).relax(opts, function(err, task){
    if(_.isObject(task)){ // task ok
      if(task.error){
        log.error(task,"can not load task")
      }else{
        mp.recipe.set(path, task, function(){
          mp.state.set(path, ds.exec, function(){
            log.info(task, "loaded and replaced")
          });
        });
      }
       }else{ // task not ok
         mp.state.set(path, ds.missing, function(){
           log.error({error:"not_found"},
                     "no task called " + taskname)
         });
       } // no task
    if(err){
      log.error({error:"request failed"}, err)
       }
  }); // view: get tasks by name
}

/**
 *  * --*-- run --*--
 *
 * ```run()``` wählt die richtige
 * ```worker```-Funktion aus und stellt den
 * callback zur Verfügung
 */
var run  = function(mp, path){
  var state = mp.state.get(path);
  if(state === ds.ready){
    mp.state.set(path, ds.work, function(){
      var task = mp.recipe.get(path);
      if(_.isObject(task) && task.Action){

        var exec = task.Action;
        if(_.isFunction(worker[exec])){

          worker[exec](mp, task, function(res){
            if(res === "ok"){
              mp.state.set(path, ds.exec, function(){
                log.info("task " + task.TaskName + " executed")
              })
            } // return ok
            if(res === "error"){
              mp.state.set(path, ds.error, function(){
                log.error(task, "task execution failed")
              })
            } // return with error
          });
        }else{
          mp.state.set(path, ds.error, function(){
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
      docmp = req.body;

  req.log.info({ok: true}, "Mp definition received");

  if(typeof docmp === "string"){
    docmp = JSON.parse(docmp);
    req.log.info(docmp, "parsed from string");
  }

  var doc =  docmp.Mp, ro;

  if(mps.hasOwnProperty(id)){
    var msg =  "already initialized, try again";
    req.log.info(ro, msg);
  }

  var element    = gen.lift(doc.Container, "Element"),
      recipe     = gen.lift(doc.Container, "Recipe"),
      state      = clone(recipe),
      definition = clone(recipe),
      title      = gen.lift(doc.Container, "Title"),
      ctl        = gen.lift(doc.Container, "Ctrl"),
      rtimerid   = clone(ctl);

  mps[id]            = {};
  mps[id].Name       = doc.Name;
  mps[id].element    = gen.mod(element);
  mps[id].definition = gen.mod(definition);
  mps[id].state      = gen.mod(state);
  mps[id].title      = gen.mod(title);
  mps[id].ctrl       = gen.mod(ctl);

  mps[id].param      = gen.mod(d);

  mps[id].id         = gen.mod({});
  mps[id].recipe     = gen.mod({});

  mps[id].rtimerid  = gen.mod(rtimerid);
  // initialize deviated structures ...
  // ... with 0 ...
  mps[id].rtimerid.ini([],0, 2, function(){
    // ... and "ready"
    mps[id].state.ini([], ds.ready, 2, cb);
  })
}
exports.ini = ini;
