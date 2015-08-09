var    _   = require("underscore")
  , bunyan   = require("bunyan")
  , clone    = require("clone")
  , ndata    = require('ndata')
  , net      = require("./net")
  , deflt    = require("./default")
  , request  = require("./request")
  , log      = bunyan.createLogger({name: deflt.app.name + ".load"})
  , mem      = ndata.createClient({port: deflt.mem.port})
  , cstr     = deflt.ctrlStr
  , ok       = {ok:true}
  , err
  , expand_task = require("./load.expandTask")
  , expand_cust = require("./load.expandCust")
  , fetch       = require("./load.fetch")
  , distribute  = require("./load.distribute")

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
        cb(null, ok)
      }
    }else{
      cb(err);
    }
  });
}
exports.ini = ini;

mem.on('message', function (ch, path){
  if(ch == "load"){
    log.info(ok
            , "load.js received load request");
    load(path);
  }
});

/**
 * Call stack
 * @method all
 * @param {Array} path
 * @param {Function} callback
 */
var load = function (path, cb){

  if(path && _.isArray(path) && (path.length >= 2)){
    var mpid = path[0]
      , no   = path[1];

    mem.publish("stop_container_obs", [mpid, no], function (err){
      if(!err){
        log.info(ok
                , "published to stop_container_obs");
        mem.remove([mpid, no, "state"], function (err){
          if(!err){
            log.info(ok
                    , "removed state");
            mem.publish("state", [mpid, no], function (err){
              if(!err){
                log.info(ok
                        , "published to state");
                mem.remove([mpid, no, "recipe"], function (err){
                  if(!err){
                    log.info(ok
                            , "removed recipe");
                    mem.publish("recipe", [mpid, no], function (err){
                      if(!err){
                        log.info(ok
                                , "published to recipe");
                        mem.get([mpid, "id"], function (err, calibobjs){
                          if(!err){
                            log.info(ok
                                    , "get id");
                            mem.get([mpid, no, "definition"], function (err, def){
                              if(!err){
                                log.info(ok
                                        , "get definition");
                                mem.get([mpid, "meta"], function (err, meta){
                                  if(!err){
                                    log.info(ok
                                            , "get meta");
                                    insert(def, calibobjs, function (err, def){
                                      if(!err){
                                        log.info(ok
                                                , "insert");
                                        distribute([mpid, no], def, meta,  function (err){
                                          if(!err){
                                            log.info(ok
                                                    , "distribute");
                                            mem.publish("start_container_obs", [mpid, no], function (err){
                                              if(!err){
                                                log.info(ok
                                                        , "published start_container_obs");
                                                if(_.isFunction(cb)){
                                                  cb(null, [mpid, no]);
                                                }
                                              }else{
                                                log.error(err
                                                         , "error on publish start_container_obs");
                                                if(_.isFunction(cb)){
                                                  cb(err);
                                                }
                                              }
                                            });
                                          }else{
                                            log.error(err
                                                     , "error on distribute");

                                            if(_.isFunction(cb)){
                                              cb(err);
                                            }
                                          }
                                        }); // distribute
                                      }else{
                                        log.error(err
                                                 , "error on attempt to insert");

                                        if(_.isFunction(cb)){
                                          cb(err);
                                        }
                                      }
                                    }); // insert
                                  }else{
                                    log.error(err
                                             , "error on attempt to get meta");
                                    if(_.isFunction(cb)){
                                      cb(err);
                                    }
                                  }
                                }); // meta
                              }else{
                                log.error(err
                                         , "error on attempt to get definition");

                                if(_.isFunction(cb)){
                                  cb(err);
                                }
                              }
                            }); // definition
                          }else{
                            log.error(err
                                     , "error on attempt to get calibobs");

                            if(_.isFunction(cb)){
                              cb(err);
                            }
                          } // if res ok rm state
                        }); // calibobjs

                      }else{
                        log.error(err
                                 , "error on publish recipe event");

                        if(_.isFunction(cb)){
                          cb(err);
                        }

                      }
                    }); // publish recipe
                  }else{
                    log.error(err
                             , "error on recipe rm");

                    if(_.isFunction(cb)){
                      cb(err);
                    }
                  }
                }); // set recipe to []
              }else{
                log.error(err
                         , "error on publishing to state channel");

                if(_.isFunction(cb)){
                  cb(err);
                }
              }
            }); // publish state
          }else{
            log.error(err
                     , "error on attempt to rm state");

            if(_.isFunction(cb)){
              cb(err);
            }
          } // if res ok rm state
        }); // set state to []
      }else{
        log.error(err
                 , "error on attempt to publish stop_container_obs");

        if(_.isFunction(cb)){
          cb(err);
        }
      }
    }); // stop_container_obs
  }else{
    var err = new Error("wrong path");
    log.error(err
             , "path is not an array or smaller than 2");
    if(_.isFunction(cb)){
      cb(err);
    }
  }
}
exports.load = load;

/**
 * Fügt über Customer erweiterte Definitionen
 * in Gesamtablauf. Bsp.: Auslese der Kundengeräte.
 * @method insert
 * @param {Array} def noch nicht expandiertes Definitionsobjekt
 * @param {Object} calibobjs geladene Kalibrierungen
 * @param {Function} cb callback
 */
var insert = function (def, calibobjs, cb){
  if(def && _.isArray(def)
         && (def.length > 0)
         && _.isArray(def[0])
         && (def[0].length > 0)
         && _.isObject(def[0][0])){

    var S      = def.length
      , ndef   = clone(def)
      , offset = 0
      , s
      , p;

    for(s = 0; s < S; s++){
      var  P = def[s].length;
      for(p = 0; p < P; p++){
        var defStep = def[s][p];
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

          if(p == 0){
            pstArr = ndef.slice(s + offset + 1, ndef.length);
            preArr = ndef.slice(0, s + offset);
            intArr = seqArr;
          }else{
            pstArr = ndef.slice(s + offset + NseqArr, ndef.length);
            oldArr = ndef.slice(s + offset, s + offset + NseqArr);
            preArr = ndef.slice(0, s + offset);
            // merge of oldArr and seqArr into intArr
            intArr = [[]];
            for(var intDef = 0; intDef < NseqArr; intDef++){
              if(_.isArray( intArr[intDef])){
                for(var oldPar = 0; oldPar < oldArr[intDef].length ; oldPar++){
                  intArr[intDef].push(oldArr[intDef][oldPar]);
                }
                for(var seqPar = 0; seqPar < seqArr[intDef].length ; seqPar++){
                  intArr[intDef].push(seqArr[intDef][seqPar]);
                }
              }else{
                err = new Error("not a array");
                log.error(err
                         , "an expandet def seems to contain a further task")
              }
            }
          }
          if( p == P - 1){
            offset = offset + NseqArr - 1;
          }
          ndef = preArr.concat(intArr).concat(pstArr);
        } // Expand seq
      } // for p
    } // for s
    if(_.isFunction(cb)){
      cb(null, ndef)
    }
  }else{
    err = new Error("wrong definition");
    log.error(err
             ,"the definition is not of the form [[{}, ..],..]");
    cb(err)
  }
}
exports.insert = insert;



exports.distribute  = distribute;
exports.fetch       = fetch;
exports.expand_cust = expand_cust;
exports.expand_task = expand_task;
