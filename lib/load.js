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
  , mem      = ndata.createClient({port: deflt.mem.port});

/**
 * Subscriptions
 * @method ini
 * @param {Function} cb
 */
var ini = function (cb){
  mem.subscribe("load", function (err){
    if(!err){
      log.info(ok
              , "load.js subscribed to load channel");
      if(_.isFunction (cb)){
        cb(ok)
      }
    }
  });
}
exports.ini = ini;

mem.on('message', function (ch, path){
  if(ch == "load"){
    log.info(ok
            , "load.js received load request");
    all(path);
  }
});

/**
 * Call stack
 * @method all
 * @param {Array} path
 */
var all = function (path){

  var mp = path[0]
    , no = path[1];

  mem.publish("stop_container_obs", path, function (err){

    setTimeout(function (){
      if(!err){
        mem.get([mp, "id"], function (err, calibobjs){
          mem.remove(path.concat(["state"]), function (err){
            if(!err){
              mem.publish("state", path, function (err){
                if(!err){
                  mem.remove(path.concat(["recipe"]), function (err){
                    if(!err){
                      mem.publish("recipe", path, function (err){
                        if(!err){
                          mem.get(path.concat(["definition"]), function (err, def){

                            insert(def, calibobjs, function (def){
                              distribute_def(path, def, function (){
                                mem.publish("start_container_obs", path, function (err){
                                  if(!err){
                                    log.info(ok
                                            , "published start_container_obs");
                                  }else{
                                    log.error({error:err}
                                             , "error on publish start_container_obs");
                                  }
                                });
                              }); // distribute_def
                            }); // insert
                          }); // definition
                        }else{
                          log.error({error:err}
                                   , "error on publish recipe event");
                        }
                      }); // publish recipe
                    }else{
                      log.error({error:err}
                               , "error on recipe rm");
                    }
                  }); // set recipe to []
                }else{
                  log.error({error:err}
                           , "error on publishing to state channel");
                }
              }); // publish state
            }else{
              log.error({error:err}
                       , "error on attempt to rm state");
            } // if res ok rm state
          }); // set state to []
        }); // calibobjs
      }else{
        log.error({error:err}
                 , "error on attempt to publish stop_container_obs");
      }
    }, 2 * deflt.container.heartbeat);
  }); // stop_container_obs
}

/**
 * Bearbeitet die expandierte Definition und veranlasst
 * den Datenbankabruf der einzelnen Tasks
 * @method distribute_def
 * @param {Array} path Pfad-array
 * @param {Array} def expandiertes Definitionsobjekt
 * @param {Function} cb callback
 */
var distribute_def = function (path, def, cb){
  var mp =  path[0];
  mem.get([mp, "meta"], function (err, meta){
    var NseqDef = def.length
      , seqDef
      , parDef
      , sem = function (){
                var isem = 0;
                return function (def, s, p){
                  var cds      = clone(def[s][p]);
                  cds.MpName   =  meta.name;
                  cds.Standard =  meta.standard;
                  isem++;
                  fetchtask(path,[s, p] , cds, function (){
                    isem--;
                    if(isem == 0){
                      cb();
                    }
                  });
                }}();

    for(seqDef = 0; seqDef < NseqDef; seqDef++){
      var NparDef = def[seqDef].length;
      for(parDef = 0; parDef < NparDef; parDef++){
        sem(def, seqDef, parDef);
      } // for parDef
    } // for seqDef
  }); // meta
}
exports.distribute_def = distribute_def;

/**
 * Fügt über Customer erweiterte Definitionen
 * in Gesamtablauf. Bsp.: Auslese der Kundengeräte.
 * @method insert
 * @param {Array} def noch nicht expandiertes Definitionsobjekt
 * @param {Object} calibobjs geladene Calibrierungen
 * @param {Function} cb callback
 */
var insert = function (def, calibobjs, cb){
  var NseqDef = def.length
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
          , intArr
          , preArr
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
          intArr = [[]];
          for(var intDef = 0; intDef < NseqArr; intDef++){
            for(var oldPar = 0; oldPar < oldArr[intDef].length ; oldPar++){
              intArr[intDef].push(oldArr[intDef][oldPar]);
            }
            for(var seqPar = 0; seqPar < seqArr[intDef].length ; seqPar++){
              intArr[intDef].push(seqArr[intDef][seqPar]);
            }
          }
        }
        if( parDef == NparDef - 1){
          offset = offset + NseqArr - 1;
        }
        ndef = preArr.concat(intArr).concat(pstArr);
      } // Expand seq
    } // for parDef
 } // for seqDef
  if(_.isFunction(cb)){

    cb(ndef)
  }
}
exports.insert = insert;

/**
 * Description
 * @method expand_task
 * @param {Object} defStep
 * @param {Object} calibobjs
 */
var expand_task = function (defStep, calibobjs){
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

/**
 * Expandiert über customer
 * @method expand_cust
 * @param {Object} defStep
 * @param {Object} calibobjs
 * @return ArrayExpression
 */
var expand_cust = function (defStep, calibobjs){
  var nParArr  = []
    , cdIds    = _.keys(calibobjs)
    , NcdIds   = cdIds.length
    , taskname = defStep.TaskName || deflt.MissingTaskName;

  if(cdIds.length > 0){
    for(var i = 0; i < NcdIds; i++){
      var calibId    = cdIds[i]
        , calibObj   = calibobjs[calibId]
        , deviceName = deflt.custDevPrefix + "_" + i
        , cps        = clone(defStep);

      if(calibObj.Device && _.isString(calibObj.Device)){
        deviceName  = calibObj.Device.replace(/\s/g, "_");
      }
      cps.Id         = [calibId];
      cps.DeviceName = deviceName;
      cps.TaskName   = deviceName + "-" + taskname;

      nParArr.push(cps);
    }
  }else{
    var cps = clone(defStep);
    cps.Id  = [];
    cps.DeviceName = deflt.custDevPrefix;
    cps.TaskName   = deflt.custDevPrefix + "-" + taskname;

    nParArr.push(cps);
  }
  return [nParArr];
}
exports.expand_cust = expand_cust;

/**
 * Holt Task von der DB
 * @method fetchtask
 * @param {Array} nopath
 * @param {Array} subpath
 * @param {Object} task
 * @param {Function} cb
 */
var fetchtask = function (nopath, subpath, task, cb){
  var con      = net.task()
    , taskname = task.TaskName
    , strtask  = JSON.stringify(task);

  log.info(ok
          ,"try to load: " + taskname);

  request.exec(con, task, strtask, function (task){
    var path_s = nopath.concat(["state"]).concat(subpath)
      , path_r = nopath.concat(["recipe"]).concat(subpath)

    if(task.error){
      mem.set(path_s, cstr.error, function (res){
        mem.publish("state", path_s, function (err){
          log.error({error: err}
                   , "set task state to error");
        }); // publish
      }); // state set
    }else{
      log.info(ok
              , "received task: " + task.TaskName + " try to set recipe");
      mem.set(path_r, task, function (err){
        if(!err){
          mem.publish("recipe", path_r, function (err){
            if(!err){
              mem.set(path_s, cstr.exec, function (err){
                if(!err){
                  mem.publish("state", path_s, function (err){
                    if(!err){
                      log.info(ok
                              , "task: " + task.TaskName + " loaded and replaced");
                    }else{
                      log.info({error:err}
                              , "error on publishing state event");
                    }
                    cb(ok)
                  }); // publish state
                }else{
                  log.error({error: err}
                           , "error on set state");
                }
              }); // set state
            }else{
              log.error({error: err}
                       ,"error on publish recipe channel");
            }
          }); // publish recipe
        }else{
          log.error({error: err}
                   ,"error on try to set task to recipe");
        }
      }); // set recipe
    } // task ok
  }); // request
}
exports.fetchtask = fetchtask;
