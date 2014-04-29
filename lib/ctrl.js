var name     = "ssmp",
    _        = require("underscore"),
    bunyan   = require('bunyan'),
    cdb      = require("./cdb"),
    gen      = require("./generate"),
    clone    = require("clone"),
    defaults = require("./defaults"),
    that = this;
var log      = bunyan.createLogger({name: name});

/**
 * load() ersetzt die tasknamen in den
 * Rezepten mit den eigentlichen Taskobjekten
 */

load  = function(mp, no, cbfn){
  var state = mp.ctrl.get([no]),
      co    = cdb.co(mp),
      dbp   = mp.param.get(["database"]),
      ok    = true;

  if(state !== "running"){
    mp.ctrl.set([no], "loading", function(){
      var recipe = mp.recipe.get([no])
      if(_.isArray(recipe)){
        var Nsno = recipe.length;
        _.each(recipe, function(selem, sno){
          var Npno = selem.length;
          _.each(selem, function(taskname, pno){
            co.view(dbp.design,dbp.tasksview,{key:taskname}, function(err, body){

              // check returned task with care
              if(body.rows    &&
                 body.rows[0] &&
                 body.rows[0].value &&
                 typeof body.rows[0].value === "object"){
                var task = body.rows[0].value;
                mp.recipe.set([no, sno, pno],task, function(){
                  mp.state.set([no, sno, pno],"loaded", function(){
                    log.info(task, "loaded and replaced")
                  });
                });
              }else{ // task ok
                ok = false;
                mp.state.set([no, sno, pno],"missing", function(){
                  log.error({ok:ok}, "no task called " + taskname)
                });
              } // no task
            }); // view: get tasks by name
          }); // inner each: par
        }); // outer each: seq
      } // recipe is array
    }); //set status
  } // not running
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

  var doc =  docmp.Mp,
      ro;

  if(mps.hasOwnProperty(id)){
    var msg =  "already initialized";
    ro      = {error: msg};

    req.log.error(ro, msg);
  }else{
    var element = gen.lift(doc.Container, "Element")
    var recipe  = gen.lift(doc.Container, "Recipe")
    var title   = gen.lift(doc.Container, "Title")
    var ctl     = gen.lift(doc.Container, "Ctrl")
    var state    = clone(recipe)

    mps[id]           = {};
    mps[id].element   = gen.mod(element);
    mps[id].recipe    = gen.mod(recipe);
    mps[id].state      = gen.mod(state);
    mps[id].title     = gen.mod(title);
    mps[id].ctrl      = gen.mod(ctl);
    mps[id].id        = gen.mod();
    mps[id].param     = gen.mod(defaults.all);

    /**
     * ... and action
     */
    var hb = mps[id].param.get(["system", "heartbeat"]);
    mps[id].observer  = setInterval(function(){
                          var mp    = mps[id],
                              state = mp.ctrl.get();
                          req.log.info(state, "observe state");
                        }, hb);

    var msg =  "ini complete";
    ro      = {result: msg};

    req.log.info(mps[id].ctrl.get(), msg);
  }

  if(_.isFunction(cbfn)){
    cbfn(ro);
  }
}
exports.ini = ini;


var walk = function(mp, no, cmd){
  //---
  var recipe = mp.recipe.get();
}