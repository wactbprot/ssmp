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
    gen      = require("./gen"),
    d        = require("./defaults"),
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
      var taskname,
          task = mp.recipe.get(path),
          opts = net.taskopts(mp);
      if(_.isObject(task) &&
         _.isString(task.TaskName)){

        taskname    = task.TaskName;
        task.MpName = mp.Name;

        opts.body   = task; // immer alles mitschicken
        opts.method = "POST";

        if(!task.CuCo){
          task.Id   = cid;
          task.CuCo = false;
        }
        if(taskname.search(d.cucoRE) === 0){
          task.CuCo = true;

          if(cid.length > 0){
            for(var i = 0; i < cid.length; i++){
              var npath    = path,
                  repldev  = cobj[cid[i]].Device.replace(/\s/g, "_");

              task.Id         = [cid[i]];
              task.DeviceName = repldev;
              task.TaskName   = taskname.replace(d.cucoRE, repldev +"-");

              log.info({ok:true}, "replaced CuCo by " + repldev)

              if(i > 0){
                var f2 = _.first(path, 2),
                    l1 = mp.state.get(f2).length;
                npath = [f2[0], f2[1], l1];
              }

              mp.recipe.set(npath, task, function(){
                mp.state.set(npath, ds.ready, function(){
                  load(mp, npath);
                });
              });
            } //for calibration ids
            }else{
              // coco task aber kein calibration docs
              task.Id = [];
              task.TaskName   = taskname.replace(d.cucoRE, mp.Name +"-");
              log.info({ok:true}, "replaced CuCo by " + mp.Name)
              mp.recipe.set(path, task, function(){
                mp.state.set(path, ds.ready, function(){
                  load(mp, path);
                });
              });
            }
        }else{
          log.info({ok:true}, "try loading " + taskname)
          // here we go:
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
      }else{ // task ist kein Object oder hat keinen Namen
        log.error({error: "not_found"},
                  "task is not an object")
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
  var state = mp.state.get(path);
  if(state === ds.ready){
    mp.state.set(path, ds.work, function(){
      var task = mp.recipe.get(path);
      if(_.isObject(task) && task.Action){

        var exec = task.Action;
        if(_.isFunction(worker[exec])){

          worker[exec](task, function(res){
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

  var element   = gen.lift(doc.Container, "Element"),
      recipe    = gen.lift(doc.Container, "Recipe"),
      state     = clone(recipe),
      title     = gen.lift(doc.Container, "Title"),
      ctl       = gen.lift(doc.Container, "Ctrl"),
      rtimerid  = clone(ctl);

  mps[id]           = {};
  mps[id].Name      = doc.Name;
  mps[id].element   = gen.mod(element);
  mps[id].recipe    = gen.mod(recipe);
  mps[id].state     = gen.mod(state);
  mps[id].title     = gen.mod(title);
  mps[id].ctrl      = gen.mod(ctl);
  mps[id].param     = gen.mod(d);

  mps[id].id        = gen.mod({});

  mps[id].rtimerid  = gen.mod(rtimerid);
  // initialize deviated structures ...
  // ... with 0 ...
  mps[id].rtimerid.ini([],0, 2, function(){
    // ... and "ready"
    mps[id].state.ini([], ds.ready, 2, cb);
  })

}
exports.ini = ini;
