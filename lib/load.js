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

var all = function(mp, no){

  mp.id.get([], function(calibobjs){

    mp.state.set([no], [], function(res){
      if(res.ok){
        mp.recipe.set([no], [], function(res){
          if(res.ok){
            mp.definition.get([no], function(def){

              insert_cust(mp, def, calibobjs, function(def){
                insert_par(mp, def, calibobjs, function(def){
                  insert_seq(mp, def, calibobjs, function(def){
                    distribute_def(mp, no, def)
                  });
                });
              });

            }); // definition
          } // if res ok recipe to []
        }); // set recipe to []
      } // if res ok state to []
    }); // set state to []

  }); // calibobjs
}
exports.all = all;

var distribute_def = function(mp, no, def, cb){
  mp.meta.get([], function(meta){
    var NseqDef = def.length
      , seqDef
      , parDef;

    for(seqDef = 0; seqDef < NseqDef; seqDef++){
      var NparDef = def[seqDef].length;
      for(parDef = 0; parDef < NparDef; parDef++){

        var cds  = clone(def[seqDef][parDef])
          , path = [no, seqDef, parDef];

        cds.MpName =  meta.name;
        mp.state.set(path, "loading", function(res){
          fetchtask(mp, path, cds)
        }); // set loading
      } // for parDef
    } // for seqDef
  }); // meta
}
exports.distribute_def = distribute_def;

var insert_cust = function(mp, def, calibobjs, cb){
  mp.meta.get([], function(meta){
    var mpname  = meta.name
      , NseqDef = def.length
      , ndef    = clone(def)
      , seqDef
      , parDef;

    for(seqDef = 0; seqDef < NseqDef; seqDef++){
      var NparDef = def[seqDef].length;
      for(parDef = 0; parDef < NparDef; parDef++){
        var defStep = def[seqDef][parDef];

        if(defStep.Customer){

          ndef[seqDef].splice(parDef, 1)

          var nArr = expand_cust(clone(defStep), calibobjs)
          // unbedingt so rum: _.union( nArr, clone(ndef[seqDef]))
          // wenn: _.union( clone(ndef[seqDef]),  nArr)
          // erhält man Sachen wie Common-Common-mach_was
          ndef[seqDef] = _.union( nArr, clone(ndef[seqDef]));
        }else{
          // im Customer Fall wird das Id-Feld von expand_cust()
          // gesetzt
          ndef[seqDef][parDef].Id = _.keys(calibobjs);
        }
      } // for parDef
    } // for seqDef

    if(seqDef ==  NseqDef){
      cb(ndef)
    }
  });
}
exports.insert_cust = insert_cust;

var insert_par = function(mp, def, calibobjs, cb){
  mp.meta.get([], function(meta){
    var mpname  =  meta.name
      , NseqDef = def.length
      , ndef    = clone(def)
      , seqDef
      , parDef;

    for(seqDef = 0; seqDef < NseqDef; seqDef++){
      var NparDef = def[seqDef].length;
      for(parDef = 0; parDef < NparDef; parDef++){
        var defStep = def[seqDef][parDef];

        if(defStep.ExpandPar){
          ndef[seqDef].splice(parDef, 1)
          ndef[seqDef] =  _.union(expand_par(clone(defStep), calibobjs), clone(def[seqDef]));
        } // expand par
      } // for parDef
    } // for seqDef

    if(seqDef ==  NseqDef){
      cb(ndef)
    }
  }); // meta
}
exports.insert_par = insert_par;

var insert_seq = function(mp, def, calibobjs, cb){
  mp.meta.get([], function(meta){
    var mpname  = meta.name
      , NseqDef = def.length
      , seqDef
      , parDef
      , ndef = clone(def)
      , offset = 0;

    for(seqDef = 0; seqDef < NseqDef; seqDef++){
      var  NparDef = def[seqDef].length;
      for(parDef = 0; parDef < NparDef; parDef++){
        var defStep = def[seqDef][parDef];

        if(defStep.ExpandSeq){
          var seqArr = expand_seq(clone(defStep), calibobjs)
            , NseqArr = seqArr.length
            , preArr
            , intArr
            , pstArr
            , oldArr;

          if(parDef == 0){
            pstArr = ndef.slice(seqDef + offset + 1, ndef.length);
            preArr = ndef.slice(0, seqDef + offset);
            intArr = seqArr;
          }else{
            pstArr  = ndef.slice(seqDef + offset + NseqArr, ndef.length);
            oldArr = ndef.slice(seqDef + offset, seqDef + offset + NseqArr);
            preArr  = ndef.slice(0, seqDef + offset);

            // merge of oldArr and seqArr into intArr
            intArr  = [];
            for(var intDef = 0; intDef < NseqArr; intDef++){
              intArr.push([]);
              intArr[intDef].push(seqArr[intDef][0]);
              intArr[intDef].push(oldArr[intDef][0]);
            }
          }
          if( parDef == NparDef - 1){
            offset = offset + NseqArr - 1;
          }
          console.log("000000000000" );
          console.log(JSON.stringify(intArr ));
          console.log("11111111111111111" );

          ndef = preArr.concat(intArr).concat(pstArr);
        } // Expand seq
      } // for parDef
    } // for seqDef
    if(seqDef ==  NseqDef){
      cb(ndef)
    }
  }); // meta
}
exports.insert_seq = insert_seq;

var expand_par = function( defStep, calibobjs){
  var nArr  = []
    , tnms
    , nStep = clone(defStep);
  // aus den n (new) definitions rauslöschen
  delete nStep.ExpandPar;

  if(_.isArray(nStep.TaskName)){
    tnms = nStep.TaskName
  }else{
    tnms = [nStep.TaskName];
  }

  var Ntn = tnms.length;

  for(var k in defStep.ExpandPar){
    var goReplace = k.match(/^@[a-z]*/) ? true : false
      , expElem   = defStep.ExpandPar[k];
    for(var v = 0; v < expElem.length; v++){
      if(goReplace){
        nStep.Replace    = nStep.Replace || {};
        nStep.Replace[k] = expElem[v];
      }else{// values go to Replace
        nStep.Use = nStep.Use || {};
        nStep.Use[k] = expElem[v];
      }// values go to Use


      for(var itn = 0; itn < Ntn; itn++){
        nStep.TaskName =  tnms[itn];
        nArr.push(clone(nStep));
      } // for itn
    } // for v
  } // for k
  return nArr;
}
exports.expand_par = expand_par;

var expand_seq = function(defStep, calibobjs){


  var nArr  = []
    , atn  =_.isArray(defStep.TaskName) ? true : false
    , dex  = clone(defStep.ExpandSeq)
    , ks   = _.keys(dex) // z.B. Values oder @exchpath
    , Nks  = ks.length // anz keys bzw der Ersetzungen
    , Nres = dex[ks[0]].length; // wird die Länge des Resul. Arrays

  // aus den n (new) definitions rauslöschen
  delete defStep.ExpandSeq;

  for(var v = 0; v < Nres; v++){
    for(var k = 0; k < Nks; k++){
      var key = ks[k]
        , goReplace = key.match(/^@[a-z]*/) ? true : false
        , expElem   = dex[key];

      if(_.isEmpty(nArr[v])){
        nArr[v] = [clone(defStep)]
      }

      if(goReplace){
        nArr[v][0].Replace = nArr[v][0].Replace || {};
        nArr[v][0].Replace[key] = expElem[v];
      }else{// values go to Replace
        nArr[v][0].Use = nArr[v][0].Use || {};
        nArr[v][0].Use[key] = expElem[v];
      }// values go to Use
      if(atn){
        nArr[v][0].TaskName =  defStep.TaskName[v];
      }
    } // for k
  } // for v
  return nArr;
}
exports.expand_seq = expand_seq;

var expand_cust = function(defStep, calibobjs){

  var nParArr  = []
    , cdIds    = _.keys(calibobjs)
    , NcdIds   = cdIds.length;

  if(cdIds.length > 0){
    for(var i = 0; i < NcdIds; i++){
      var calibId    = cdIds[i]
        , calibObj   = calibobjs[calibId]
        , deviceName = deflt.cucoDevPrefix + "_" + i
        , cps = clone(defStep);

      if(calibObj.Device && _.isString(calibObj.Device)){
        deviceName  = calibObj.Device.replace(/\s/g, "_");
      }
      cps.Id         = [calibId];
      cps.DeviceName = deviceName;
      cps.TaskName   = deviceName + "-" + defStep.TaskName;

      nParArr.push(cps)
    }
  }else{
    var cps = clone(defStep);
    cps.Id  = [];
    cps.DeviceName = deflt.cucoDevPrefix
    cps.TaskName   = deflt.custDevPrefix + "-" + defStep.TaskName

    nParArr.push(cps)
  }
  return nParArr;
}
exports.expand_cust = expand_cust;

var fetchtask = function(mp, path, task){
  var con      = net.task(mp)
    , taskname = task.TaskName
    , strtask  = JSON.stringify(task);

  log.info({ok:true}
          ,"try to load: "
          + taskname);
  // (mp, con, task, path, wrtdata, cb)

  request.exec(mp, con, task, path, strtask, function(task){
    if(task.error){
      mp.state.set(path, ctrlstr.error, function(res){
        log.error({error: "set task state to error"}
                 ,"task set to error")
      })
    }else{
      log.info({ok:true}
              , "received task: "
              + task.TaskName
              + " try to set recipe");

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
    } // task ok
  }); // request
}
