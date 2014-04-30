var name     = "ssmp",
    _        = require("underscore"),
    bunyan   = require('bunyan'),
    cdb      = require("./cdb"),
    gen      = require("./generate"),
    clone    = require("clone"),
    defaults = require("./defaults"),
    that     = this;

var log      = bunyan.createLogger({name: name});

/**
 * load() ersetzt die TaskNamen in den
 * Rezepten mit den eigentlichen Objekten
 */

load  = function(mp, no, sno, pno){
  var  taskname,
      co       = cdb.co(mp),
      dbp      = mp.param.get(["database"]),
      task     = mp.recipe.get([no,sno,pno]);
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
                mp.recipe.set([no, sno, pno], task, function(){
                  mp.state.set([no, sno, pno],"loaded", function(){
                    log.info(task, "loaded and replaced")
                  });
                });
              }else{ // task ok

                mp.state.set([no, sno, pno],"missing", function(){
                  log.error({error:"not_found"}, "no task called " + taskname)
                });
              } // no task
            }); // view: get tasks by name
  }else{ // task ist string
    log.error({error:"not_found"}, "receive taskname: " + taskname)
  }
};
exports.load = load;

exports.run  = function(mp, no){
};

exports.stop = function(mp, no){
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
var ini = function(mps, req, cbfn){
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
    var element = gen.lift(doc.Container, "Element")
    var recipe  = gen.lift(doc.Container, "Recipe")
    var title   = gen.lift(doc.Container, "Title")
    var ctl     = gen.lift(doc.Container, "Ctrl")
    var state   = clone(recipe)

    mps[id]           = {};
    mps[id].element   = gen.mod(element);
    mps[id].recipe    = gen.mod(recipe);
    mps[id].state     = gen.mod(state);
    mps[id].title     = gen.mod(title);
    mps[id].ctrl      = gen.mod(ctl);
    mps[id].id        = gen.mod();
    mps[id].param     = gen.mod(defaults.all);

    if(_.isFunction(cbfn)){
      cbfn();
    }
  }
}
exports.ini = ini;

var observe = function(mp){
  var state = mp.ctrl.get();
  _.each(state,function (cmd, no){
    // load tasks
    if(cmd == "load"){
      mp.ctrl.set([no], "loading", function(){
        walk(mp, no, cmd, function(){
          mp.ctrl.set([no], "loaded")
        });
      });
    }
    if(cmd == "run"){

    }
  });
};
exports.observe = observe;

var walk = function(mp, no, exec, cbfn){

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

        that[exec](mp, no, sno, pno);

        if(Ipno == Npno  &&
           Isno == Nsno  &&
           _.isFunction(cbfn)){
          cbfn();
        }
      });
    });
  }
}
