var name     = "ssmp",
    _        = require("underscore"),
    bunyan   = require("bunyan"),
    clone    = require("clone"),
    cdb      = require("./cdb"),
    gen      = require("./gen"),
    defaults = require("./defaults").all,
    worker   = require("./worker"),
    log      = bunyan.createLogger({name: defaults.appname}),
    ds       = defaults.statstr;

/**
 * load() ersetzt die TaskNamen in den
 * Rezepten mit den eigentlichen Objekten
 */
var load  = function(mp, path){
  var state    = mp.state.get(path);

  if(state === ds.ready){
    // bevor irgendwas geschieht
    // state erstmal auf working
    // setzen
    mp.state.set(path, ds.work, function(){
      var taskname,
          co       = cdb.co(mp),
          dbp      = mp.param.get(["database"]),
          task     = mp.recipe.get(path);
      // load ist auch
      // reload; in diesem Fall
      // ist task ein schon ein object

      if(_.isObject(task) &&
         _.isString(task.TaskName)){
        taskname = task.TaskName;
      }

      if(_.isString(task)){
        taskname = task;
      }

      log.info({ok:true}, "try loading " + taskname)

      if(taskname){
      co.view(dbp.design, dbp.tasksview, {key:taskname},
              function(err, body){
                // check returned task with care
                if(body.rows          &&
                   body.rows[0]       &&
                   body.rows[0].value &&
                   _.isObject(body.rows[0].value)){

                  var task = body.rows[0].value;
                  mp.recipe.set(path, task, function(){
                    mp.state.set(path, ds.exec, function(){
                      log.info(task, "loaded and replaced")
                    });
                  });

                }else{ // task ok
                  mp.state.set(path, ds.missing, function(){
                    log.error({error:"not_found"}, "no task called " + taskname)
                  });
                } // no task
              }); // view: get tasks by name
      }else{ // task ist string
        log.error({error:"not_found"}, "receive taskname: " + taskname)
      }
    }); // set work
  } // if ready
};
exports.load = load;

var run  = function(mp, path){
  var state = mp.state.get(path);
  if(state === ds.ready){
    mp.state.set(path, ds.work, function(){
      var task     = mp.recipe.get(path);

      if(_.isObject(task) &&
         task.Action){
        var exec = task.Action;
        worker[exec](task, function(res){
          if(res === "ok"){
            mp.state.set(path, ds.exec, function(){
              log.info(task, "executed")
            })
          }
          if(res === "error"){
            mp.state.set(path, ds.error, function(){
              log.info(task, "executed")
            })
          }
          });

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
    mps[id].rtimerid.ini([],0, function(){
      // ... and "ready"
      mps[id].state.ini([],ds.ready, cb);
    })
  }
}
exports.ini = ini;
