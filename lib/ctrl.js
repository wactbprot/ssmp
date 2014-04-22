var _       = require("underscore"),
    name    = "ssmp",
    bunyan  = require('bunyan'),
    log     = bunyan.createLogger({name: name}),
    cdb     = require("./cdb");


/**
 * load() ersetzt die tasknamen in den
 * Rezepten mit den eigentlichen Taskobjekten
 */

exports.load  = function(mp, no, cbfn){

  var state = mp.status.get([no]),
      co    = cdb.co(mp),
      dbp   = mp.param.get(["database"]),
      ok    = true;

   if(state !== "running"){
    mp.status.set([no], "loading", function(){
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
                  mp.status.set([no], "loaded", function(){
                    cbfn({ok:ok})
                  })
                }else{ // loading complete
                  mp.status.set([no], "uncomplete", function(){
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