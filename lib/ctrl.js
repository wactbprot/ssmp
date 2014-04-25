var name     = "ssmp",
    _        = require("underscore"),
    bunyan   = require('bunyan'),
    cdb      = require("./cdb"),
    gen      = require("./generate"),
    clone    = require("clone"),
    defaults = require("./defaults");

var log      = bunyan.createLogger({name: name});

/**
 * load() ersetzt die tasknamen in den
 * Rezepten mit den eigentlichen Taskobjekten
 */

exports.load  = function(mp, no, cbfn){
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
                  mp.proc.set([no, sno, pno],"loaded", function(){
                    log.info(task, "loaded and replaced")
                  });
                });
              }else{ // task ok
                ok = false;
                mp.proc.set([no, sno, pno],"missing", function(){
                  log.error({ok:ok}, "no task called " + taskname)
                });
              } // no task

              if(sno == Nsno -1  && pno == Npno -1  ){
                log.info({ok:ok}, "loading complete")
                if(ok){
                  mp.ctrl.set([no], "loaded", function(){
                    cbfn({ok:ok})
                  })
                }else{ // loading complete
                  mp.ctrl.set([no], "uncomplete", function(){
                    cbfn({ok:ok})
                  })
                } // loading uncomplete
              } // loading complete
            }); // view: get tasks by name
          }); // inner each: par
        }); // outer each: seq
      } // recipe is array
    }); //set status
  } // not running
};

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

  var doc = docmp.Mp

  if(mps.hasOwnProperty(id)){
    var msg =  "already initialized",
        ro = {error: msg};

    req.log.error(ro, msg);
  }else{
    var element = gen.lift(doc.Container, "Element")
    var recipe  = gen.lift(doc.Container, "Recipe")
    var title   = gen.lift(doc.Container, "Title")
    var ctl     = gen.lift(doc.Container, "Ctrl")
    var proc    = clone(recipe)

    mps[id]           = {};

    mps[id].element   = gen.mod(element);
    mps[id].recipe    = gen.mod(recipe);
    mps[id].proc      = gen.mod(proc);
    mps[id].title     = gen.mod(title);
    mps[id].ctrl      = gen.mod(ctl);
    mps[id].id        = gen.mod();
    mps[id].param     = gen.mod(defaults.all);

    var msg =  "ini complete",
        ro  = {ok: true};

    req.log.info(mps[id], msg);
  }

  if(_.isFunction(cbfn)){
    cbfn(mps[id]);
  }
}
exports.ini = ini;
