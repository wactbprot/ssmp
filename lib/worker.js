/**
 * ## Die ```worker()``` Funktionen
 *
 * Die ```worker()``` arbeiten ```task```s ab.
 *
 *  Tasks sind _json_-Objekte; es sind die Parametersätze
 *  der ```worker()``` Functionen.
 *
 *  Ein einfaches Bsp. für eine ```task``` ist Warten
 * (Auszug aus Messprogrammdefinition):
 *
 *  ```
 *  "Name":"Mp",
 *  ...
 *  "Defaults": {
 *           "_waittime": 1000,
 *           "_waitfor": "Ready in",
 *           "_waitunit": "ms"
 *         },
 *  "Tasks":[
 *         {
 *          "Action": "wait",
 *          "Comment": "_waitfor  _waittime ms",
 *          "TaskName": "wait",
 *          "WaitTime": "_waittime"
 *        },
 *  ...
 *  ```
 *
 * ### Ersetzungen
 *
 * In dieser ```task``` müssen noch die mit einem Unterstrich
 * beginnenden Zeichenketten (_strings_) also z.B. ```_waitfor``` und
 * ```_waittime``` ersetzt werden; womit, kann an drei
 * verschiedenen Stellen (abhängig von den Anforderungen) angegeben werden:
 *
 * #### Defaults
 *
 * Ersetzung durch Angaben aus dem gleichen Objekt (z.B. im gleichen
 * CalibrationObject oder Standard ect.) unter dem key ```Defaults```
 *
 *
 * #### Replace
 * In einer Rezeptdefinition unter dem key ```Replace```
 *
 * Ersetzungen, die unterhalb ```Replace``` angegeben sind, sind __vorrangig__
 * gegenüber den Ersetzungen in ```Defaults```. Wird
 * also eine Definition:
 *
 * ```
 * "Definition": [
 *                [
 *                    {
 *                        "TaskName": "Mp-wait",
 *                        "Replace": {
 *                            "_waittime": 300
 *                        }
 *                    }
 *                ],
 *                [
 *                    {
 *                        "TaskName": "Mp-wait",
 *                        "Replace": {
 *                            "_waittime": 300
 *                        }
 *                    }
 *                ]
 *            ]
 * ```
 * abgearbeitet, wird 300 als ```waittime``` realisiert falls etwas
 * Anderes in den ```Defaults``` angegeben ist.
 *
 * #### FromExchange
 *
 * Direkt in der _task_ unter dem key ```FromExchange``` wobei
 * hier **Ersetzungen zur Laufzeit** vorgenommen werden. Darüber
 * hinaus kann ```FromExchange``` auch ein Array von Werten sein.
 *
 * __BTW:__
 * Die hier (bei den worker-Funktionen) ankommenden
 * Tasks sind von der aufrufenden Funktion
 * ```run()``` schon auf 'object' getestet. Der ```state```
 * ist von ```run()``` auch schon auf ```working``` gesetzt.
 *
 *
 * @author wactbprot (wactbprot@gmail.com)
 */

var _        = require("underscore"),
    bunyan   = require("bunyan"),
    clone    = require("clone"),
    deflt    = require("./default"),
    utils    = require("./utils"),
    net      = require("./net"),
    request  = require("./request"),
    compare  = require("./compare"),
    log      = bunyan.createLogger({name: deflt.appname}),
    ctrlstr  = deflt.ctrlStr;

var ndata = require('ndata');
var mem   = ndata.createClient({port: 9000})

/**
 * ```wait()``` verzögert den Ablauf um die unter
 * ```task.WaitTime``` angegebene Zeit in ms.
 * @method wait
 * @param {Object} task Task-Objekt
 * @param {Function} cb Callback Funktion
 * @return 
 */
var wait = function(task, cb){

  var path = task.Path
    , ro = {ok:true};

  if(task && task.WaitTime){
    setTimeout(function(){

      log.info(ro,
               "waittime over");
      if(_.isFunction(cb)){
        cb(ro);
      }
    }, parseInt(task.WaitTime,10))

  }else{
    ro = {error:"no waittime"};
    log.error(ro, "no task.Value or task.Value.WaitTime");
    if(_.isFunction(cb)){
      cb(ro);
    }
  }
};

/**
 * (Mess-) Aufträge an den _node-relay_-server
 * werden an diesen mit der ```nodeRelay()```
 * Funktion gesandt.
 * @method nodeRelay
 * @param {Object} task Task-Objekt
 * @param {Function} cb Callback Funktion
 * @return 
 */
var nodeRelay = function(task, cb){
  var path    = task.Path
    , ro      = {ok:true}
    , con     = net.relay()
    , wrtdata = JSON.stringify(task);

  log.info(ro,
           "try request to nodeRelay");

  request.exec(con, task, wrtdata, function(data){
    if(data.error){
      ro = {error:data.error}
      log.error(ro
               , "received error in callback");
      cb(ro);
    }else{
      log.info(ro
              , "request callback succesful");
      var dp = task.DocPath    && task.DocPath    !== ""
        , ep = data.ToExchange && data.ToExchange !== ""
        , rr = data.Result     && data.Result     !== "";

      if(dp && ep){
        log.info(ro
                , "found DocPath and ToExchange, try to save");
        utils.query_cd(task, data, function(res){
          if(res.ok){
            log.info(ro,
                     "try to write to exchange");
            utils.write_to_exchange(task, data, path, cb);
          }else{
            ro = {error:"in call back of query_cd"}
            log.error(ro,
                      "try to write to exchange");
            cb(ro);
          }
        })
      } // dp & ep

      if(dp && !ep){
        log.info(ro,
                 "found DocPath and Results try to save");
        utils.query_cd(task, data, cb)
      } // dp && !ep

      if(!dp && ep){
        log.info(ro,
                 "found ToExchange, try to exchange");
        utils.write_to_exchange(task, data, path, cb)

      } //!dp && ep

      if(!dp && !ep && rr){
        log.info(ro,
                 " simple pass with Result is: " + data.Result);
        cb(ro);
      } //!dp && ep

    } // data.error
  });
};

/**
 * Funktion speichert Zeit in ms seit 1970
 * in angegebeben DocPath unter dem
 * @method getTime
 * @param {Object} task Task-Objekt
 * @param {Function} cb Callback Funktion
 * @return 
 */
var getTime = function(task, cb){
  var path = task.Path
    , ro   = {ok:true}

  if(task.DocPath && task.Type){
    log.info(ro
            , "call query_cd function");

    utils.query_cd(task
                  , {
                    Result:[
                      {Type:task.Type,
                       Value:utils.vl_time(),
                       Unit:"ms"}
                    ]
                  }
                  , cb)
  }else{
    ro =  {error:"key missing"}
    log.error(ro
             , "task.DocPath and/or task.Type missing");
    cb(ro);
  }
}
/**
 * Funktion speichert Zeit in ms seit 1970
 * in angegebeben DocPath unter dem
 * @method getDate
 * @param {Object} task Task-Objekt
 * @param {Function} cb Callback Funktion
 * @return 
 */
var getDate = function(task, cb){
  var path = task.Path
    , ro = {ok:true}

  if(task.DocPath && task.Type){
    log.info(ro
            , "call query_cd function")

    utils.query_cd(task
                  , {
                    Result:[
                      {Type:task.Type,
                       Value:utils.vl_date(),
                       Unit:"ms"}]}
                  , cb)
  }else{
    ro =  {error:"key missing"}
    log.error(ro
             , "task.DocPath and/or task.Type missing");
    cb(ro);
  }
}

/**
 * Die worker Funktion ```writeExchange()``` erlaubt es,
 * zur Laufzeit Einträge in der _exchange_-Schnittstelle
 * zu erstellen.
 * Anwendungsbeispiel: Ein Messgerät kann nicht
 * elektronisch ausgelesen werden; es müssen manuelle
 * Eingabefelder erstellt werden. Dazu ist
 * ```addElement()``` gedacht.
 * @method writeExchange
 * @param {Object} task Task-Objekt
 * @param {Function} cb Callback Funktion
 * @return 
 */
var writeExchange = function(task, cb){
  var ro     = {ok:true}
    , path   = task.Path
    , path_b = [path[0]]
    , path_e = path_b.concat("exchange")

  if(task.Value &&
     task.Key){

    // alles nach exchange,
    // unter elems nur noch path zu
    // exchange
    var prob,
        exchObj   = {},
        key       = task.Key,
        val       = task.Value;

    if(task.Customer){
      key = deflt.cucoStr + "-" + key;
    }
    var path_k = path_e.concat(key.split("."))
    mem.set(path_k, val, function(err){
      if(!err){
        log.info(ro,
                 "wrote " + key + " to Exchange")
        mem.publish("exchange", path_k, function(err){
          if(!err){
            log.info(ro,
                     "published to to exchange")
            if(_.isFunction(cb)){
              cb(ro);
            }
          }else{
            log.error({err:err}
                     , "on attempt to publish to to exchange")

          }
        }); // publish exch
      }else{
        ro = {error:err};
        log.error(ro
                 , "on attempt to set exchange value")
        if(_.isFunction(cb)){
          cb(ro);
        }
      }
    });
  }else{
    ro = {error:"not a valid task"};
    log.error(ro, "missing  Key or Value")
    if(_.isFunction(cb)){
      cb(ro);
    }
  }
};

/**
 * Die worker Funktion ```readExchange()``` erlaubt es,
 * zur Laufzeit Einträge aus der _exchange_-Schnittstelle
 * auszulesen.
 * Anwendungsbeispiel: Ein Messgerät kann nicht
 * elektronisch ausgelesen werden; es sind Eingabefelder
 * erstellt, ausgefüllt und vom Client an _exchange_
 * zurückgesandt. Der Client muss dann den key ```Ready.value```
 * auf true setzen
 * (Bsp.: ```exchange.calibration-pressure.Ready.value:true```).
 * Mir der Funktion  ```readExchange()```
 * wird (wenn ```data.Ready.value:true``` oder es kein
 * ```data.Ready``` gibt) der Wert aus
 * ```exchange[Task.Key]``` zerlegt
 * und all die Elemente, bei denen das Attribut ```save```
 * zu ```true``` evaluiert wird
 * (z.B. ```exchange.calibration-pressure.Unit.save:true```
 * in die entsprechenden  Kalibrierdokumente geschrieben.
 * @method readExchange
 * @param {Object} task Task-Objekt
 * @param {Function} cb Callback Funktion
 * @return 
 */
var readExchange = function(task, cb){
  var ro     = {ok:true}
    , key    = task.Key
    , path   = task.Path
    , path_b = [path[0]]
    , path_e = path_b.concat("exchange")

  if(key){
    if(task.Customer){
      key = deflt.cucoStr + "-" + key;
    }
    var path_d  = path_e.concat(key.split("."));

    mem.get(path_d, function(err, data){
      if(!err){
        if(_.isUndefined(data)){
          ro = {error:"struct missing"}
          log.error(ro,
                    "nothing below " + key)
          if(_.isFunction(cb)){
            cb(ro);
          }
        }else{
          var dR = data.Ready
          if( _.isUndefined(dR) || dR.value == true || dR.value == "true"){
            var valcoll = {};
            for(var k in data){

              if(_.isObject(data[k]) && ! _.isUndefined(data[k].value) && data[k].save){

                if(data[k].type === "number"){
                  valcoll[k] = parseFloat(data[k].value);
                }else{
                  valcoll[k] = data[k].value;
                }
              }
            }
            log.info(ro
                    , "try storing data")
            if(!_.isEmpty(valcoll)){
              utils.query_cd(task
                            , {Result:[valcoll]}
                            , function(res){

                                if(res.ok){
                                  if(_.isUndefined(data.Ready)){
                                    if(_.isFunction(cb)){
                                      cb(ro);
                                    }
                                  }else{
                                    var path_r = path_d.concat(["Ready"]);
                                    mem.set(path_r, false, function(err){
                                      if(res.ok){
                                        log.info(ro
                                                , "reset exchange " + key + "Ready to false" );
                                        mem.publish("exchange", path_r, function(err){
                                          log.info(ro
                                                  , "publish to  exchange channel");
                                          if(!err){
                                            if(_.isFunction(cb)){
                                              cb(ro);
                                            }
                                          }else{
                                            log.error({error:err}
                                                     , "on attempt to publish to exchange channel");
                                          }
                                        });
                                      }else{
                                        ro = {error:"reset ready flag"};
                                        log.info(ro
                                                , " error on reset exchange." + key + "." + "Ready" );
                                        if(_.isFunction(cb)){
                                          cb(ro);
                                        }
                                      }
                                    });
                                  }
                                }else{
                                  if(_.isFunction(cb)){
                                    cb(res);
                                  }
                                }
                              });
            }else{
              ro = {error:"no values to save"};
              log.info(ro
                      ,"the value collection failed" );
              if(_.isFunction(cb)){
                cb(ro);
              }
            }
          }else{
            if(_.isFunction(cb)){
              setTimeout(function(){
                cb({again:true});
              }, deflt.system.againdelay)
            }
          }
        }
      } // if get exch err
    }); // get data from exchange
  }else{
    ro = {error:"not a valid task"};
    log.error(ro,
              "missing  key to read from")
    if(_.isFunction(cb)){
      cb(ro);
    }
  }
};

/**
 * Die worker Funktion ```getList()```
 * holt Daten von einer Datenbank-List-Abfrage.
 * Die ```task``` benötigt die Einträge  ```task.ListName```
 * und ```task.ViewName```.
 * Anwendungnsbeispiel: Datensätze zur Auswahl
 * eines Kalibrierdokuments.
 * @method getList
 * @param {Object} task Task-Objekt
 * @param {Function} cb Callback Funktion
 * @return 
 */
var getList = function(task, cb){

  var ro     = {ok:true}
    , con    = net.list(task)
    , path   = task.Path
    , path_e = [path[0], "exchange"];
  request.exec(con, task, false, function(listdata){
    var path_t = task.ExchangePath;
    if(path_t  && path_t !== ""){
      var path_s = path_e.concat(path_t.split("."));
      mem.set(path_s, listdata, function(err){
        if(!err){
          mem.publish("exchange", path_s, function(err){
            if(!err){
              log.info(ro
                      , "wrote data to exchange");
              if(_.isFunction(cb)){
                cb(ro);
              }
            }else{
              log.error({error: err}
                       , "error on publishing to exchange channel")
            }

          });
        }else{
          ro = {error: err}
          log.error(ro
                   , "error on writing to exchange")
          if(_.isFunction(cb)){
            cb(ro);
          }
        }
      }); // set exchange
    }else{
      log.error({error: "receive list data"}
               , "don't know what todo with received data: "
               + JSON.stringify(listdata)
               + " need a exchangepath");
    }
  });
};

/**
 * Die worker Funktion ```checkDB()```
 * prüft die Verfügbarkeit der Datenbank über
 * den api Endpunkt /db
 * @method checkDB
 * @param {Object} task Task-Objekt
 * @param {Function} cb Callback Funktion
 * @return 
 */
var checkDB = function(task, cb){

  var ro     = {ok:true}
    , con    = net.checkdb()
    , path   = task.Path
    , path_e = [path[0], "exchange"];

  request.exec(con, task, false, function(dbinfo){
    var path_t = task.ExchangePath;
    if(path_t  && path_t !== ""){
      var path_s = path_e.concat(path_t.split("."));

      if(dbinfo.error){
        dbinfo.available = false;
      }else{
        dbinfo.available = false;
      }

      mem.set(path_s, dbinfo, function(err){
        if(!err){
          mem.publish("exchange", path_s, function(err){
            if(!err){
              log.info(ro
                      , "wrote data to exchange");
              if(_.isFunction(cb)){
                cb(ro);
              }
            }else{
              log.error({error: err}
                       , "error on publishing to exchange channel")
            }
          });
        }else{
          ro = {error: err}
          log.error(ro
                   , "error on writing to exchange")
          if(_.isFunction(cb)){
            cb(ro);
          }
        }
      }); // set exchange
    }else{
      log.error({error: "receive list data"}
               , "don't know what todo with received data: "
               + JSON.stringify(dbinfo)
               + " need a exchangepath");
    }
  });
};

/**
 * Die worker Funktion ```checkRelay()```
 * prüft die Verfügbarkeit der Datenbank über
 * den api Endpunkt /db
 * @method checkRelay
 * @param {Object} task Task-Objekt
 * @param {Function} cb Callback Funktion
 * @return 
 */
var checkRelay = function(task, cb){

  var ro     = {ok:true}
    , con    = net.relay()
    , path   = task.Path
    , path_e = [path[0], "exchange"]
    , tsk    = clone(task)
    , relayinfo;

  tsk.Action = "_version";
  request.exec(con, task, JSON.stringify(tsk), function(data){
    if(data.Result || data.error){
      var path_t = task.ExchangePath;
      if(path_t  && path_t !== ""){
        var path_s    = path_e.concat(path_t.split("."));
        if(data.Result){
          relayinfo = {version: data.Result
                      , available:true};
        }else{
          relayinfo = {error: data.error,
                       available:false};
        }
        mem.set(path_s, relayinfo , function(err){
          if(!err){
            mem.publish("exchange", path_s, function(err){
              if(!err){
                log.info(ro
                        , "wrote data to exchange");
                if(_.isFunction(cb)){
                  cb(ro);
                }
              }else{
                log.error({error: err}
                         , "error on publishing to exchange channel")
              }
            });
          }else{
            ro = {error: err}
            log.error(ro
                     , "error on writing to exchange")
            if(_.isFunction(cb)){
              cb(ro);
            }
          }
        }); // set exchange
      }else{
        log.error({error: "receive info data"}
                 , "don't know what todo with received data: "
                 + JSON.stringify(data)
                 + " need a exchangepath");
      }
    }else{
      ro = {error: "receive unexpected data"};
      log.error(ro
               , "receive no data.Result")
      if(_.isFunction(cb)){
        cb(ro);
      }
    }
  });
};

/**
 * Holt KDs, über update list und schreibt KD zurück.
 * @method updateCd
 * @param {Object} task Task-Objekt
 * @param {Function} cb Callback Funktion
 * @return 
 */
var updateCd = function(task, cb){

  var path = task.Path
    , mpid = path[0]
    , ro   = {ok:true};

  mem.get([mpid, "id"], function(err, sd){
    if(!err){
      var ids = _.keys(sd)
        , N   = ids.length;
      if(N > 0){
        for(var i = 0; i < N; i++){

          var id     = ids[i];
          log.info(ro
                  ,"try to update: " + id)
          task.Param = {id: id};
          var getcon = net.list(task);
          request.exec(getcon, task, false
                      , function(last, id){
                          return function(updoc){
                            if(updoc._id){
                              var wrtcon    = net.wrtdoc(updoc._id)
                                , wrtdata   = JSON.stringify(updoc);
                              log.info(ro
                                      ,"try to write doc with id: " + id)
                              request.exec(wrtcon, task, wrtdata
                                          , function(res){
                                              if(res.ok){
                                                log.info(ro
                                                        ,"doc with id: " + res.id + " got new revision "
                                                        +  res.rev + " on storing");
                                                if(last){
                                                  cb(res);
                                                }
                                              }else{
                                                ro = {error: "update request"};
                                                log.error(res
                                                         , "while try to save updated doc")
                                              }
                                            })
                            }else{
                              ro = {error:"update request"};
                              log.error(ro,
                                        "object returned by db has no _id property")
                              if(_.isFunction(cb)){
                                cb(ro)
                              }
                            }
                          }
                        }(i == N-1, id))
        }
      }else{
        log.warn({warn:"no cd id"}
                , "no calibration doc selected");
        if(_.isFunction(cb)){
          cb(ro)
        }
      }
    }else{
      ro = err
      log.error(ro
               , "error on attempt to get id interface");
      if(_.isFunction(cb)){
        cb(ro)
      }
    }
  }); // get short doc objects
}

/**
 * Die worker Funktion ```ctrlContainer```
 * erlaubt es taskgesteuert den ctrl-String
 * von Containern zu setzen. Ein Anwendungsbeispiel
 * ist das Starten des Initialisierungscontainers
 * nachdem die KD-ids ausgewählt wurden.
 * @method ctrlContainer
 * @param {Object} task Task-Objekt
 * @param {Function} cb Callback Funktion
 * @return 
 */
var ctrlContainer = function(task, cb){
  var path   = task.Path
    , ro     = {ok:true}
    , mpid   = path[0]
    , path_b = [mpid]

  if(task.Value && _.isObject(task.Value)){
    var containers = _.keys(task.Value)
      , N = containers.length;

    for( var i = 0; i < N; i++ ){

      var no       = containers[i]
        , ctrlStr  = task.Value[no]
        , path_c   = [mpid, no, "ctrl"]

      mem.set(path_c, ctrlStr
             , function(last, n, c){
                 return function(err){
                   if(!err){
                     log.info(ro
                             , "set container: " + n + " to "+ c);
                   }else{
                     ro = {error:err}
                     log.info(ro
                             ,"error on attempt to set container: " + no + " to " + c);
                   }
                   if(last){
                     if(_.isFunction(cb)){
                       cb(ro);
                     }
                   }
                 }
               }(i == N-1, no, ctrlStr))
    } //for
  } // task.value
}


exports.VXI11         = nodeRelay;
exports.TCP           = nodeRelay;
exports.UDP           = nodeRelay;
exports.wait          = wait;
exports.writeExchange = writeExchange;
exports.readExchange  = readExchange;
exports.getList       = getList;
exports.ctrlContainer = ctrlContainer
exports.updateCd      = updateCd
exports.getTime       = getTime;
exports.getDate       = getDate;

exports.checkDB       = checkDB;
exports.checkRelay    = checkRelay;

//exports["/usr/local/bin/vxiTransceiver"] = nodeRelay;

//exports.select        = select;
// /**
//  * Die worker Funktion ```select()``` wählt auf Basis
//  * der unter _exchange_ derzeitig vorhandenen Werte
//  * (z.B. ```target_pfill.Value.value```
//  * ein Folgerezept für den aufrufenden Container aus.
//  * In der ```task``` muss die Rezeptklasse unter dem Pfad
//  * ```task.Value.RecipeClass``` gegeben sein.
//  *
//  * @param {Object} task Task-Objekt
//  * @param {Array} pfad Pfad Array
//  * @param {Function} cb Callback Funktion
//  */
//
// var select = function(task, path, cb){
//   var ro;
//   // --- rewrite if can be tested
//   // dont work for the moment
//   // because of async get recipe conditions
//
//   if(task.Value &&
//      task.Value.RecipeClass){
//     var rclass = task.Value.RecipeClass;
//
//     mp.definitions.get([],function(defs){
//       var take   = false
//         , pos    = clone(path).shift();
//
//       for(var i = 0; i < defs.length; i++){
//         var def = defs[i];
//         if(def.RecipeClass === rclass){
//           log.info({ok:true}
//                   , "found recipe class")
//           var conds = def.Conditions;
//           take  = true;
//           for(var j = 0; j < conds.length; j++){
//             var cond = conds[j];
//             if(cond.ExchangePath &&
//                cond.Value &&
//                cond.Methode){
//
//               mp.exchange.get(cond.ExchangePath, function(exchval){
//                 var condval = cond.Value;
//
//                 if(_.isUndefined(exchval)){
//                   take = false;
//                 }else{
//                   take = take && compare[cond.Methode](exchval, condval);
//                 }
//               }); // exchpath
//             }
//           }
//           if(take){
//             ro = {ok:true};
//             log.info(ro
//                     , "found matching recipe")
//             mp.definition.del([pos], function(){
//                 mp.recipe.del([pos], function(){
//                   log.info(ro
//                           , "sync def and state: " + pos);
//                   mp.definition.set([pos], def.Definition, function(){
//                     utils.cp(..., def.Definition, ctrlstr.ready, function(){
//                       mp.ctrl.get([pos], function(oldctrl){
//                         mp.ctrl.set([pos], ctrlstr.load + ";" + oldctrl, function(){
//                           log.info(ro
//                                   , "load matching recipe")
//                           if(_.isFunction(cb)){
//                             cb(ro);
//                           }
//                         });
//                       });
//                     });
//                   });
//                 });
//               });
//
//             break;
//           } // take
//         } // if rclass
//       } // for
//       if(!take){
//         ro = {error:"no condition match"};
//         log.error(ro,
//                   "no recipe matches the conditions");
//         if(_.isFunction(cb)){
//           cb(ro)
//         }
//       }
//     });  // get recipe
//   }else{
//     ro = {error:"recipe class missing"};
//     log.error(ro,
//               "don't know which RecipeClass to look for")
//     if(_.isFunction(cb)){
//       cb(ro)
//     }
//   }
// };
