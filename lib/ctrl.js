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

  var state = mp.go.get([no]),
      co    = cdb.co(mp),
      dbp   = mp.param.get(["database"]);

  if(state !== "running"){
    mp.go.set([no], "loading")
    var recipe = mp.recipe.get([no])
    if(_.isArray(recipe)){
      _.each(recipe, function(selem, sno){
        _.each(selem, function(taskname, pno){
          co.view(dbp.design,dbp.tasksview,{key:taskname}, function(err, body){
            if(body.rows[0].value){
              var task = body.rows[0].value;
              if(typeof task === "object"){
                mp.recipe.set([no, sno, pno],task, function(){
                  log.info(task, "loaded and replaced")
                });
              } // returned task is a object
            } // body has value
          }); // view
        });// inner for
      });// outer for
    } // recipe is array
  }
};

exports.run  = function(mp, no){
};

exports.stop = function(mp, no){
};