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
    defaults = require("./defaults").all,
    worker   = require("./worker"),
    log      = bunyan.createLogger({name: defaults.appname}),
    ds       = defaults.statstr;

/**
 * --*-- load --*--
 *
 * ```load()``` läd die Task und sendet die
 * Replacements (wenn vorhanden) im POST body.
 */
var load  = function(mp, path){
  var state    = mp.state.get(path);

  if(state === ds.ready){
    /*
    * bevor irgendwas geschieht wird der
    * ```state``` erstmal auf ```working```
    * gesetzen; alles weitere geschieht
    * als callback des state setters
    */
    mp.state.set(path, ds.work, function(){
      var taskname,
          task = mp.recipe.get(path),
          opts = net.taskopts(mp);
      /*
       * ```load()``` ist auch
       * reload; in diesem Fall
       * ist task ein schon die
       * eigentliche task
       * (und keine Ersetzungsvorschrift)
       */
      if(_.isObject(task) &&
         _.isString(task.TaskName)){
        taskname = task.TaskName;

        if(_.isObject(task.Replace)){
          opts.body = task.Replace;
          opts.method ="POST";
        }
      }
      if(_.isString(task)){
        taskname = task;
      }

      opts.params = {key :taskname};
      log.info({ok:true}, "try loading " + taskname)

      if(taskname){

        net.dbcon(mp).relax(opts, function(err, task){
          if(_.isObject(task) &&
             task.TaskName === taskname){ // task ok
              mp.recipe.set(path, task, function(){
                mp.state.set(path, ds.exec, function(){
                  log.info(task, "loaded and replaced")
                });
              });
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
      }else{ // task ist string
        log.error({error:"not_found"},
                  "receive taskname: " + taskname)
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
                log.info(task, "task executed")
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

  req.log.debug(docmp, "Mp definition received");
  req.log.info({ok:true}, "Mp definition received");

  if(typeof docmp === "string"){
    docmp = JSON.parse(docmp);
    req.log.info(docmp, "parsed from string");
  }

  var doc =  docmp.Mp, ro;

  if(mps.hasOwnProperty(id)){
    var msg =  "already initialized";
    ro      = {error: msg};

    req.log.error(ro, msg);

    if(_.isFunction(cb)){
      cb(ro);
    }
  }else{
    var element   = gen.lift(doc.Container, "Element");
    var recipe    = gen.lift(doc.Container, "Recipe");
    var state     = clone(recipe);
    var title     = gen.lift(doc.Container, "Title");
    var ctl       = gen.lift(doc.Container, "Ctrl");
    var rtimerid  = clone(ctl);

    mps[id]           = {};
    mps[id].element   = gen.mod(element);
    mps[id].recipe    = gen.mod(recipe);
    mps[id].state     = gen.mod(state);
    mps[id].title     = gen.mod(title);
    mps[id].ctrl      = gen.mod(ctl);
    mps[id].id        = gen.mod();
    mps[id].param     = gen.mod(defaults);

    mps[id].rtimerid  = gen.mod(rtimerid);
    // initialize deviated structures ...
    // ... with 0 ...
    mps[id].rtimerid.ini([],0, 2, function(){
      // ... and "ready"
      mps[id].state.ini([], ds.ready, 2, cb);
    })
  }
}
exports.ini = ini;
