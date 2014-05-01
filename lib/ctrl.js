var name     = "ssmp",
    _        = require("underscore"),
    bunyan   = require('bunyan'),
    clone    = require("clone"),
    cdb      = require("./cdb"),
    gen      = require("./generate"),
    defaults = require("./defaults"),
    worker   = require("./worker"),
    that     = this;

var log      = bunyan.createLogger({name: name});

/**
 * load() ersetzt die TaskNamen in den
 * Rezepten mit den eigentlichen Objekten
 */

var load  = function(mp, path){
  var  taskname,
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

  if(taskname){
    co.view(dbp.design, dbp.tasksview, {key:taskname},
            function(err, body){
              // check returned task with care
              if(body.rows    &&
                 body.rows[0] &&
                 body.rows[0].value &&
                 typeof body.rows[0].value === "object"){

                var task = body.rows[0].value;
                mp.recipe.set(path, task, function(){
                  mp.state.set(path,"ready", function(){
                    log.info(task, "loaded and replaced")
                  });
                });
              }else{ // task ok

                mp.state.set(path,"missing", function(){
                  log.error({error:"not_found"}, "no task called " + taskname)
                });
              } // no task
            }); // view: get tasks by name
  }else{ // task ist string
    log.error({error:"not_found"}, "receive taskname: " + taskname)
  }
};
that.load = load;

var run  = function(mp, path){
  var task     = mp.recipe.get(path);
  var state    = mp.state.get(path);
  console.log(state)
  if(_.isObject(task) &&
     task.Action      &&
     state === "ready"){

    var exec = task.Action;
    mp.state.set(path, "running",
                 function(){
                   worker[exec](task, function(res){
                     if(res === "ok"){
                       mp.state.set(path, "executed");
                     }
                     if(res === "error"){
                       mp.state.set(path, "error");
                     }
                   });

                 });
  }
};
that.run = run;

exports.stop = function(mp, path){
};


/**
 * --*-- ini --*--
 *
 * POST
 * http://server:port/mpid/mp
 *
 * Bsp.:
 *
 * http://localhost:8001/mpid/mp
 *
 * ```mpid``` ist die ```id``` des Messprogrammdokuments
 * bzw. der Messprogrammdefinition im POST-Body
 */
var ini = function(mps, req, callback){
  var id    = req.params.id,
      docmp = req.body;

  req.log.info(docmp, "Mp definition received");

  if(typeof docmp === "string"){
    docmp = JSON.parse(docmp);
    req.log.info(docmp, "parsed from string");
  }

  var doc =  docmp.Mp, ro;

  if(mps.hasOwnProperty(id)){
    var msg =  "already initialized";
    ro      = {error: msg};
    req.log.error(ro, msg);

  }else{
    var element   = gen.lift(doc.Container, "Element");
    var recipe    = gen.lift(doc.Container, "Recipe");
    var state     = clone(recipe);
    var title     = gen.lift(doc.Container, "Title");
    var ctl       = gen.lift(doc.Container, "Ctrl");

    mps[id]           = {};
    mps[id].element   = gen.mod(element);
    mps[id].recipe    = gen.mod(recipe);
    mps[id].state     = gen.mod(state);
    mps[id].title     = gen.mod(title);
    mps[id].ctrl      = gen.mod(ctl);
    mps[id].id        = gen.mod();
    mps[id].param     = gen.mod(defaults.all);

    mps[id].rtimerid  = gen.mod(state);;

    if(_.isFunction(callback)){
      callback();
    }
  }
}
exports.ini = ini;

/**
 * cobserve is the container observer;
 * he looks on the state on the
 * global containers and reakts on
 * certain key word like:
 * - load
 * - run
 * - pause
 * - stop
 */
var cobserve = function(mp){
  var state = mp.ctrl.get();
  _.each(state, function (cmd, no){

    if(cmd == "load"){
      mp.ctrl.set([no], "loading", function(){
        walk(mp, no, cmd, function(){
          mp.ctrl.set([no], "ready")
        });
      });
    }

    if(cmd == "run"){
      var rid = setInterval(function(){
                  robserve(mp[no]);
                }, mp.param.get(["system", "heartbeat"]))

      mp.rtimerid.set([no], rid, function(){
        mp.ctrl.set([no], "running");
      })
      console.log(mp.rtimerid.set([no]))
    }

    if(cmd == "stop"){
      mp.ctrl.set([no], "stoping");
      clearInterval(mp.rtimerid.get([no]));
      mp[no].rtimerid  = 0;
      mp.ctrl.set([no], "stoped");
    }
  });
};
exports.cobserve = cobserve;

var robserve = function( container){
  console.log("robs")
};



/**
 * walkes over the recipe structure
 * and executes that[exec] with a callback
 */
var walk = function(mp, no, exec, callback){
  var recipe = mp.recipe.get([no]),
      Isno   = 0,
      Ipno   = 0;
  if(_.isArray(recipe)){
    var Nsno = recipe.length;
    _.each(recipe, function(elem, sno){
      Isno++;
      Ipno = 0;
      var Npno = elem.length;
      _.each(elem, function(value, pno){
        Ipno++

        that[exec](mp, [no, sno, pno]);

        if(Ipno == Npno  &&
           Isno == Nsno  &&
           _.isFunction(callback)){
          callback();
        }
      });
    });
  }
}
