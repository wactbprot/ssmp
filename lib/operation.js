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

  var spath    = clone(path).push("State"),
      state    = mp.definition.get(spath),
      cobj     = mp.id.get(),
      cid      = _.keys(cobj); // calibration doc ids

  if(state === ds.ready){

    mp.definition.set(spath, ds.work, function(){
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
                  l1 = mp.definition.get(f2).length;
              npath  = [f2[0], f2[1], l1];
            }

            protask.Id         = [cid[i]];
            protask.CuCo       = true;
            protask.DeviceName = repldev;
            protask.TaskName   = taskname.replace(d.cucoRE, repldev +"-");

            log.info({ok:true}, "replaced CuCo by " + repldev)

            mp.definition.set(clone(npath).push("State"), ds.ready, function(){
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
          protask.TaskName   = taskname.replace(d.cucoRE, mp.Name +"-");

          log.info({ok:true}, "replaced CuCo by " + mp.Name)

          mp.definition.set(clone(path).push("State"), ds.ready, function(){
            mp.recipe.set(path, protask, function(){
              fetchtask(mp, path);
            });
          });
        }
      }else{

        protask.TaskName = taskdef.TaskName
        protask.Id       = cid;
        protask.CuCo     = false;
        mp.definition.set(clone(path).push("State"), ds.ready, function(){
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
          mp.definition.set(clone(path).push("State"), ds.exec, function(){
            log.info(task, "loaded and replaced")
          });
        });
      }
       }else{ // task not ok
         mp.definition.set(clone(path).push("State"), ds.missing, function(){
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
  var state = mp.definition.get(clone(path).push("State"));
  if(state === ds.ready){
    mp.definition.set(clone(path).push("State"), ds.work, function(){
      var task = mp.recipe.get(path);
      if(_.isObject(task) && task.Action){

        var exec = task.Action;
        if(_.isFunction(worker[exec])){

          // ------------------------------------------------- //
          worker[exec](mp, task, path, function(res){
            if(res === "ok"){
              mp.definition.set(clone(path).push("State"), ds.exec, function(){
                log.info("task " + task.TaskName + " executed")
              })
            } // return ok
            if(res === "error"){
              mp.definition.set(clone(path).push("State"), ds.error, function(){
                log.error(task, "task execution failed")
              })
            } // return with error
          });
          // ------------------------------------------------- //
        }else{
          mp.definition.set(clone(path).push("State"), ds.error, function(){
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
  var id  = req.params.id,
      rb  = req.body;

  req.log.info({ok: true}, "Mp id received");

  // ToDo:
  // if(if(typeof rb === "object")

  if(typeof rb === "string" && rb === "load"){
    if(mps.hasOwnProperty(id)){
      log.info({ok:true},"already initialized, try again")
    }

    mps[id] = {};
    var
        mp    = mps[id];

    mp.param      = gen.mod(d);
    mp.id         = gen.mod({});
    mp.recipe     = gen.mod({});


    net.doc(mp).get(id, function(error, doc){
      if(error){
        log.error({error:error}, "failed to load mp definition");
      }
      if(doc){
        log.info({ok:true}, "try to build mp");
        build(mp, doc, cb)
      }
    });
  } // load
}
exports.ini = ini;

var build = function(mp, docmp, cb){

  var doc        = docmp.Mp,
      element    = gen.lift(doc.Container, "Element"),
      definition = gen.lift(doc.Container, "Recipe"),
      title      = gen.lift(doc.Container, "Title"),
      ctl        = gen.lift(doc.Container, "Ctrl"),
      rtimerid   = clone(ctl);

  mp.exchange   = gen.mod(doc.Exchange);
  mp.recipes    = gen.mod(doc.Recipes);
  mp.Name       = doc.Name;
  mp.element    = gen.mod(element);
  mp.definition = gen.mod(definition);
  mp.title      = gen.mod(title);
  mp.ctrl       = gen.mod(ctl);
  mp.rtimerid   = gen.mod(rtimerid);
  // initialize deviated structures ...
  // ... with 0 ...
  mp.rtimerid.ini([],0, 2, function(){
    log.info({ok:true}, "mp build");
  });

};
