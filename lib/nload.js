var name     = "ssmp",
    _        = require("underscore"),
    bunyan   = require("bunyan"),
    net      = require("./net"),
    deflt    = require("./default"),
    request  = require("./request"),
    log      = bunyan.createLogger({name: deflt.appname}),
    ctrlstr  = deflt.ctrlStr;

var load = function(mp, no){
  var mpname =  mp.name
    , seqDef
    , parDef;

  mp.state.set([no], [], function(res){
    if(res.ok){
      mp.recipe.set([no], [], function(res){
        if(res.ok){
          mp.definition.get([no], function(definition){
            mp.id.get([], function(calibobjs){
              var  cdids  = _.keys(calibobjs) // calibration doc ids
                , NseqDef    = definition.length;

              for(seqDef = 0; seqDef < NseqDef; seqDef++){
                var NparDef = definition[seqDef].length;
                for(parDef = 0; parDef < NparDef; parDef++){
                  var defstep = definition[seqDef];
                  // {
                  //   TaskName:""
                  //   Customer:true/false
                  //   Replace:{
                  //            "@f":"g"
                  //   }
                  //   Use:{
                  //        "i":"j"
                  //   }
                  //   ExpandPar:{
                  //                "@ap":["b", "c"] // expand parallel in Replace
                  //               ,"dp":["e", "f"] // expand parallel in Use
                  //   }
                  //   ExpandSeq:{
                  //                "@as":["b", "c"] // expand sequen. in Replace
                  //               ,"ds":["e", "f"] // expand sequen. in Use
                  // }
                  // }






                } // for parDef
              } // for seqDef
            })
          }); // definition
        } // if res ok recipe to []
      }); // set recipe to []
    } // if res ok state to []
  }); // set state to []
}
module.exports = load;


var fetchtask = function(mp, path){

  mp.recipe.get(path, function(task){
    var    con      = net.task(mp),
        taskname = task.TaskName;

    log.info({ok:true}
            ,"try to load: "
            + taskname);
    // (mp, con, task, path, wrtdata, cb)
    request.exec(mp, con, task, path, JSON.stringify(task)
                , function(task){
                    log.info({ok:true}
                            , "received task: "
                            + task.TaskName
                            + " try to set recipe")

                    mp.recipe.set(path, task, function(res){
                      if(res.ok){
                        mp.state.set(path, ctrlstr.exec, function(res){
                          if(res.ok){
                            log.info({ok:true}
                                    ,"task: "
                                    + task.TaskName
                                    +" loaded and replaced")
                          }
                          if(res.error){
                            log.error({error: "task state"}
                                     ,"on try to set state for task")
                          }
                        });
                      }
                      if(res.error){
                        log.error({error: "task to recipe"}
                                 ,"on try to set task to recipe")
                      }
                    }); // set recipe
                  }); // request
  }); // get task
}
