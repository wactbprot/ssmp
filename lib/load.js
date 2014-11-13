/**
 * Erstellt das Rezept aus der Definition
 *
 * @param {Object} mp Messprog.-Objekt
 * @param {Number} no Nummer des Containers
 * (--> was eigentlich zum path zusammengefasste werden sollte
 */

var name     = "ssmp"
  , _        = require("underscore")
  , bunyan   = require("bunyan")
  , clone    = require("clone")
  , ndata    = require('ndata')
  , net      = require("./net")
  , deflt    = require("./default")
  , request  = require("./request")
  , log      = bunyan.createLogger({name: deflt.appname})
  , cstr     = deflt.ctrlStr
  , ok       = {ok:true}
  , mem      = ndata.createClient({port: 9000});

mem.subscribe("load", function(err){
  if(!err){
    log.info(ok
            , "load.js subscribed to load channel");
  }
})

mem.on('message', function(ch, mpid_no){
  if(ch == "load"){
    log.info(ok
            , "load.js received load request");
    all(mpid_no);
  }
});

var all = function(mpid_no){
  var mpid = mpid_no[0]
    , no   = mpid_no[1]
  mem.get([mpid, "id"], function(err, calibobjs){
    mem.set([mpid, "state", no], [], function(err){
      if(!err){
        mem.set([mpid, "recipe", no], [], function(err){
          if(!err){
            mem.get([mpid, "definition", no], function(err, def){
              insert(mpid_no, def, calibobjs, function(def){
                distribute_def(mpid_no, def)
              });
            }); // definition
          } // if res ok recipe to []
        }); // set recipe to []
      } // if res ok state to []
    }); // set state to []
  }); // calibobjs
}
exports.all = all;

/**
 * Bearbeitet die expandierte Definition und veranlasst
 * den Datenbankabruf der einzelnen Tasks
 *
 * @param {Object} mp Messprog.-Objekt
 * @param {Number} no Nummer des Containers
 * @param {Array} def expandiertes Definitionsobjekt
 * @param {Function} cb callback
 */
var distribute_def = function(mpid_no, def, cb){
  var mpid = mpid_no[0]
    , no   = mpid_no[1]
  mem.get([mpid, "meta"], function(err, meta){
    mem.set([mpid, "state", no], "loading", function(err){
      var NseqDef = def.length
        , seqDef
        , parDef;
      for(seqDef = 0; seqDef < NseqDef; seqDef++){
        var NparDef = def[seqDef].length;
        for(parDef = 0; parDef < NparDef; parDef++){

          var cds  = clone(def[seqDef][parDef])

          cds.MpName =  meta.name;

          (function(path, subpath, task){
            return fetchtask(path, subpath, task);
          }([mpid],[no, seqDef, parDef], cds))
          
        } // for parDef
      } // for seqDef
    }); // set loading
  }); // meta
}
exports.distribute_def = distribute_def;

/**
 * Fügt über Customer erweiterte Definitionen
 * in Gesamtablauf. Bsp.: Auslese der Kundengeräte.
 *
 * @param {Object} mp Messprog.-Objekt
 * @param {Array} def noch nicht expandiertes Definitionsobjekt
 * @param {Object} calibobjs geladene Calibrierungen
 * @param {Function} cb callback
 */
var insert = function(mpid_no, def, calibobjs, cb){
  var mpid = mpid_no[0]
    , no   = mpid_no[1]
  mem.get([mpid, "meta"], function(err, meta){

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
        }else{
          seqArr = expand_task(clone(defStep), calibobjs)
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

var expand_task = function(defStep, calibobjs){
  var nArr  = []
    , ids   = _.keys(calibobjs)
    , atn   = defStep.TaskName
    , dex
    , eCase
    , Nres

  defStep.Id = ids;

  if(defStep.ExpandSeq){
    dex  = clone(defStep.ExpandSeq)
    delete defStep.ExpandSeq;
    eCase = "as_seq"
  }
  if(defStep.ExpandPar){
    dex  = clone(defStep.ExpandPar)
    delete defStep.ExpandPar;
    eCase = "as_par"
    Nres = atn.length;
  }
  if(defStep.ExpandByName){
    dex   = clone(defStep.ExpandByName)
    delete defStep.ExpandByName;
    eCase = "by_name"
  }

  if(eCase){
    var ks   = _.keys(dex) // z.B. Values oder @exchpath
      , Nks  = ks.length // anz keys bzw der Ersetzungen

    Nres = dex[ks[0]].length;

    for(var v = 0; v < Nres; v++){
      for(var k = 0; k < Nks; k++){
        var key = ks[k]
          , goReplace = key.match(/^@[a-z]*/) ? true : false
          , expElem   = dex[key];

        if(eCase == "as_seq" || eCase == "by_name"){
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

          if(_.isArray(atn)){
            nArr[v][0].TaskName =  atn[v];
          }else{
            nArr[v][0].TaskName =  atn;
          }
        }

      if(eCase == "as_par"){
        if(_.isEmpty(nArr[0])){
          nArr[0] = []
        }
        if(_.isEmpty(nArr[0][v])){
          nArr[0][v] = clone(defStep)
        }
        if(goReplace){
          nArr[0][v].Replace = nArr[0][v].Replace || {};
          nArr[0][v].Replace[key] = expElem[v];
        }else{// values go to Replace
          nArr[0][v].Use = nArr[0][v].Use || {};
          nArr[0][v].Use[key] = expElem[v];
        }// values go to Use

        if(_.isArray(atn)){
          nArr[0][v].TaskName =  atn[v];
        }else{
          nArr[0][v].TaskName =  atn;
        }
      }

      } // for k
    } // for v

    if(eCase == "by_name"){
      var nnArr =[]
        , aatn = _.isArray(atn) ? atn: [atn];
      for(var i = 0; i < nArr.length; i++){
        for(var j = 0; j < aatn.length; j++){
          var nStep = clone(nArr[i][0])
          nStep.TaskName =  aatn[j];
          nnArr.push([nStep])
        }
      }
      nArr = nnArr;
    }
    return nArr;
  }else{
    return [[defStep]]
  }

}
exports.expand_task = expand_task;

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

var fetchtask = function(path, subpath,  task){
  var con      = net.task()
    , taskname = task.TaskName
    , strtask  = JSON.stringify(task);

  log.info(ok
          ,"try to load: "
          + taskname);
  // (mp, con, task, path, wrtdata, cb)

  request.exec(con, task, strtask, function(task){
    var spath = path.concat(["state"]).concat(subpath)
      , rpath = path.concat(["recipe"]).concat(subpath)
    if(task.error){

      mem.set(spath, cstr.error, function(res){
        log.error({error: "set task state to error"}
                 ,"task set to error")
      })
    }else{
      log.info(ok
              , "received task: "
              + task.TaskName
              + " try to set recipe");
      mem.set(rpath, task, function(err){
        if(!err){
          mem.set(spath, cstr.exec, function(err){
            if(!err){
              log.info(ok
                      ,"task: "
                      + task.TaskName
                      +" loaded and replaced")
            }else{
              log.error({error: "task state"}
                       ,"on try to set state for task")
            }
          });
        }else{
          log.error({error: "task to recipe"}
       ,"on try to set task to recipe")
        }
      }); // set recipe
    } // task ok
  }); // request
}
