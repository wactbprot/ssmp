var name     = "ssmp",
    _        = require("underscore"),
    bunyan   = require("bunyan"),
    clone    = require("clone"),
    net      = require("./net"),
    deflt    = require("./default"),
    request  = require("./request"),
    log      = bunyan.createLogger({name: deflt.appname}),
    ctrlstr  = deflt.ctrlStr;

var all = function(mp, no){

  mp.id.get([], function(calibobjs){

    mp.state.set([no], [], function(res){
      if(res.ok){
        mp.recipe.set([no], [], function(res){
          if(res.ok){
            mp.definition.get([no], function(def){

              insert(mp, def, calibobjs, function(def){
                console.log(JSON.stringify(def))
                distribute_def(mp, no, def)
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

var insert = function(mp, def, calibobjs, cb){
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

        var seqArr;
        if(defStep.Customer){
          seqArr = expand_cust(clone(defStep), calibobjs)
          // Id ist set inside for each customer device
        }
        if(defStep.ExpandSeq){
          seqArr = expand_seq(clone(defStep), calibobjs)
        }
        if(defStep.ExpandByName){
          seqArr = expand_by_name(clone(defStep), calibobjs)
        }
        if(defStep.ExpandPar){
          seqArr = expand_par(clone(defStep), calibobjs)
        }

        if(seqArr){
          var NseqArr = seqArr.length
            , preArr
            , intArr
            , pstArr
            , oldArr;

          if(parDef == 0){
            pstArr = ndef.slice(seqDef + offset + 1, ndef.length);
            preArr = ndef.slice(0, seqDef + offset);
            intArr = seqArr;
          }else{
            pstArr = ndef.slice(seqDef + offset + NseqArr, ndef.length);
            oldArr = ndef.slice(seqDef + offset, seqDef + offset + NseqArr);
            preArr = ndef.slice(0, seqDef + offset);

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
          ndef = preArr.concat(intArr).concat(pstArr);
        } // Expand seq
      } // for parDef
    } // for seqDef
    if(seqDef ==  NseqDef){
      cb(ndef)
    }
  }); // meta
}
exports.insert = insert;

var expand_par = function( defStep, calibobjs){
  var tnms
    , nArr  = []
    , ids   = _.keys(calibobjs)
    , nStep = clone(defStep);


  // aus den n (new) definitions rauslöschen
  delete nStep.ExpandPar;
  nStep.Id = ids;

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
  return [nArr];
}
exports.expand_par = expand_par;

var expand_seq = function(defStep, calibobjs){
  var nArr  = []
    , ids   = _.keys(calibobjs)
    , atn  =_.isArray(defStep.TaskName) ? true : false
    , dex  = clone(defStep.ExpandSeq)
    , ks   = _.keys(dex) // z.B. Values oder @exchpath
    , Nks  = ks.length // anz keys bzw der Ersetzungen
    , Nres = dex[ks[0]].length; // wird die Länge des Resul. Arrays

  // aus den n (new) definitions rauslöschen
  delete defStep.ExpandSeq;
  defStep.Id = ids;

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

var expand_by_name = function(defStep, calibobjs){
  var nArr  = []
    , nnArr = []
    , ids   = _.keys(calibobjs)
    , dex   = clone(defStep.ExpandByName)
    , ks    = _.keys(dex) // z.B. Values oder @exchpath
    , tns   = clone(defStep.TaskName)
    , Ntn   = tns.length
    , Nks   = ks.length // anz keys bzw der Ersetzungen
    , Nres  = dex[ks[0]].length;

  // aus den n (new) definitions rauslöschen
  delete defStep.ExpandByName;
  delete defStep.TaskName;
  defStep.Id = ids;

  for(var v = 0; v < Nres; v++){
    for(var k = 0; k < Nks; k++){
      var key = ks[k]
        , goReplace = key.match(/^@[a-z]*/) ? true : false
        , expElem   = dex[key];
      if(_.isEmpty(nArr[v])){
        nArr[v] = clone(defStep)
      }
      if(goReplace){
        nArr[v].Replace = nArr[v].Replace || {};
        nArr[v].Replace[key] = expElem[v];
      }else{// values go to Replace
        nArr[v].Use = nArr[v].Use || {};
        nArr[v].Use[key] = expElem[v];
      }// values go to Use

    } // for k
  } // for v
  for(var i = 0; i < nArr.length; i++){
    for(var j = 0; j < Ntn; j++){
      var nStep = clone(nArr[i])
      nStep.TaskName =  tns[j];
      nnArr.push([nStep])
    }
  }
  return nnArr;
}
exports.expand_by_name = expand_by_name;

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
  return [nParArr];
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
