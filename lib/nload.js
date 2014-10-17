var name     = "ssmp",
    _        = require("underscore"),
    bunyan   = require("bunyan"),
    clone    = require("clone"),
    net      = require("./net"),
    deflt    = require("./default"),
    request  = require("./request"),
    log      = bunyan.createLogger({name: deflt.appname}),
    ctrlstr  = deflt.ctrlStr;


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
//   }
// }



var load = function(mp, no){
  var mpname =  mp.name
    , seqDef
    , parDef;
  mp.id.get([], function(calibobjs){
    mp.state.set([no], [], function(res){
      if(res.ok){
        mp.recipe.set([no], [], function(res){
          if(res.ok){
            mp.definition.get([no], function(def){
              var NseqDef;
              // ----- * ----- customer ----- * -----v
              // zuerst Customer erweitern
              // der wird immer bzw. selbstredent
              // parallel expandiert
              NseqDef = def.length;
              for(seqDef = 0; seqDef < NseqDef; seqDef++){
                var NparDef = def[seqDef].length;
                for(parDef = 0; parDef < NparDef; parDef++){
                  var defStep = def[seqDef][parDef];

                  if(defStep.Customer){
                    def[seqDef].splice(parDef, 1)
                    def[seqDef] =  _.union(def[seqDef]
                                          ,expand_cust(mp, defStep, calibobjs));
                  }

                } // for parDef
              } // for seqDef
              // ----- * ----- customer ----- * -----^

              // ----- * ----- expandPar----- * -----v
              // parallele expansion
              NseqDef = def.length;
              for(seqDef = 0; seqDef < NseqDef; seqDef++){
                var NparDef = def[seqDef].length;
                for(parDef = 0; parDef < NparDef; parDef++){
                  var defStep = def[seqDef][parDef];

                  if(defStep.ExpandPar){
                    def[seqDef].splice(parDef, 1)
                    def[seqDef] =  _.union(def[seqDef]
                                          ,expand_par(mp, defStep, calibobjs));
                  } // expand par
                } // for parDef
              } // for seqDef
              // ----- * ----- expandPar ----- * -----^

              // ----- * ----- expandSeq----- * -----v
              // sequentielle expansion
              NseqDef = def.length;

              var ndef = clone(def)
                , lengthAdd = 0;

              for(seqDef = 0; seqDef < NseqDef; seqDef++){
                var nseqArr

                  , NparDef = def[seqDef].length;
                for(parDef = 0; parDef < NparDef; parDef++){
                  var defStep = def[seqDef][parDef];
                  if(defStep.ExpandSeq){
                    var seqArr =  expand_seq(mp, defStep, calibobjs)
                      , preArr = ndef.slice(0,seqDef) // #)
                      , pstArr = ndef.slice(seqDef + 1, ndef.length);

                    if(parDef == 0){
                      nseqArr = seqArr
                    }else{
                      nseqArr = _.zip(nseqArr, seqArr)
                    }
                    if(parDef == NparDef -1){
                      for(var k = 0; k < nseqArr.length; k++){
                        // Länge von ndef und def weichen jetzt voneinander ab #)
                        preArr.push(nseqArr[k]);
                      }
                      lengthAdd = lengthAdd + k; //#)
                    }
                  } // Expand seq
               } // for parDef
              } // for seqDef
              // ----- * ----- expandSeq ----- * -----^

            }); // definition
          } // if res ok recipe to []
        }); // set recipe to []
      } // if res ok state to []
    }); // set state to []
  }); // calibobjs
}
module.exports = load;

var expand_par = function(mp, defStep, calibobjs){
  var nArr  = []
    , nStep = clone(defStep);
  // aus den n (new) definitions rauslöschen
  delete nStep.ExpandPar;

  for(var k in defStep.ExpandPar){
    var goReplace = k.match(/^@[a-z]*/) ? true : false
      , expElem   = defStep.ExpandPar[k];

    for(var v = 0; v < expElem.length; v++){
      if(goReplace){
        nStep.Replace = nStep.Replace || {};
        nStep.Replace[k] = expElem[v];
      }else{// values go to Replace
        nStep.Use = nStep.Use || {};
        nStep.Use[k] = expElem[v];
      }// values go to Use

      nArr.push(clone(nStep));

    } // for v
  } // for k
  return nArr;
}

var expand_seq = function(mp, defStep, calibobjs){
  var nArr  = []
    , nStep = clone(defStep);
  // aus den n (new) definitions rauslöschen
  delete nStep.ExpandSeq;

  for(var k in defStep.ExpandSeq){
    var goReplace = k.match(/^@[a-z]*/) ? true : false
      , expElem   = defStep.ExpandSeq[k];

    for(var v = 0; v < expElem.length; v++){
      if(goReplace){
        nStep.Replace = nStep.Replace || {};
        nStep.Replace[k] = expElem[v];
      }else{// values go to Replace
        nStep.Use = nStep.Use || {};
        nStep.Use[k] = expElem[v];
      }// values go to Use

      nArr.push(clone(nStep));
    } // for v
  } // for k
  return nArr;
}

var expand_cust = function(mp, defStep, calibobjs){
  var nParArr  = []
    , nParStep = clone(defStep)
    , cdIds  = _.keys(calibobjs)
    , NcdIds  = cdIds.length;

  if(cdIds.length > 0){
    for(var i = 0; i < NcdIds; i++){
      var calibId    = cdIds[i]
        , calibObj   = calibobjs[calibId]
        , deviceName = deflt.cucoDevPrefix + "_" + i;
      if(calibObj.Device &&
         _.isString(calibObj.Device)){
        deviceName  = calibObj.Device.replace(/\s/g, "_");
      }
      nParStep.TaskName = deviceName + "-" + defStep.TaskName;
      nParArr.push(clone(nParStep))
    }
  }
  return nParArr;
}

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
