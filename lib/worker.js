var _        = require("underscore")
  , bunyan   = require("bunyan")
  , clone    = require("clone")
  , ndata    = require("ndata")
  , deflt    = require("./default")
  , utils    = require("./utils")
  , net      = require("./net")
  , request  = require("./request")
  , compare  = require("./compare")
  , ctrlstr  = deflt.ctrlStr
  , log      = bunyan.createLogger({name: deflt.appname})
  , mem      = ndata.createClient({port: 9000})

/**
 * ```wait()``` verzögert den Ablauf um die unter
 * ```task.WaitTime``` angegebene Zeit in ms.
 * Defaultwert ist eien Wartezeit von 1000ms
 * @method wait
 * @param {Object} task Task-Objekt
 * @param {Function} cb Callback Funktion
 */

var wait = function(task, cb){
  var  ro  = {ok:true}
    , path = task.Path
    , wt   = task.WaitTime ? task.WaitTime:1000
    , nwt  = parseInt(wt, 10)

  log.info(ro,
           "call function wait");
  if(_.isNaN(nwt)){
    ro = {error: "not a number"}
    log.error(ro
             , "can not parse waittime to number");
    if(_.isFunction (cb)){
      cb(ro);
    }
  }else{
    setTimeout(function (){
      log.info(ro,
               "waittime over");
      if(_.isFunction (cb)){
        cb(ro);
      }
    }, nwt)
  }
};

/**
 * (Mess-) Aufträge an den _node-relay_-server
 * werden an diesen mit der ```nodeRelay()```
 * Funktion gesandt.
 * @method nodeRelay
 * @param {Object} task Task-Objekt
 * @param {Function} cb Callback Funktion
 */
var nodeRelay = function (task, cb){
  var path    = task.Path
    , ro      = {ok:true}
    , con     = net.relay()
    , wrtdata = JSON.stringify(task);

  log.info(ro,
           "call function nodeRelay");

  log.info(ro,
           "try request to nodeRelay");

  request.exec(con, task, wrtdata, function (data){
    if(data.error){
      ro = {error:data.error}
      log.error(ro
               , "received error in callback");
      cb(ro);
    }else{
      log.info(ro
              , "request callback succesful");
      if(data.ok){
        log.info(ro
                , " exec callback with simple ok");
        cb(data);
      }else{
        var dp = task.DocPath    && task.DocPath    !== ""
          , ep = data.ToExchange && data.ToExchange !== ""
          , rr = data.Result     && data.Result     !== "";

        if(dp && ep){
          log.info(ro
                  , "found DocPath and ToExchange, try to save");
          utils.query_cd(task, data, function (res){
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
                   " simple pass with Result: " + JSON.stringify(data.Result));
          cb(ro);
        } //!dp && ep
      }
    } // data.error
  });
};

/**
 * Funktion speichert Zeit in ms seit 1970
 * unter angegebeben ```task.DocPath```
 * mit angegebenem ```task.Type```
 * ```Typ``` hat den Defaultwert ```amt```
 * was absolut measure time heisen soll.
 *
 * @method getTime
 * @param {Object} task Task-Objekt
 * @param {Function} cb Callback Funktion
 */
var getTime = function (task, cb){
  var ro   = {ok:true}
    , type = task.Type ? task.Type : "amt";

  log.info(ro,
           "call function gettime");
  if(task.DocPath){
    log.info(ro
            , "try to call query_cd function")
    utils.query_cd(task
                  , {Result:
                     [
                       {Type: type,
                        Value: utils.vl_time(),
                        Unit: "ms"}
                     ]
                    }
                  , cb)
  }else{
    ro = {error: "missing docpath"}
    log.error(ro
             , "task.DocPath is missing");
    cb(ro);
  }
}

/**
 * Funktion speichert Datum im vl format
 * unter angegebeben ```task.DocPath```.
 * Fallback für ```task.Typ``` ist
 * amd, was absolut measure date heisen
 * soll
 *
 * @method getDate
 * @param {Object} task Task-Objekt
 * @param {Function} cb Callback Funktion
 */
var getDate = function (task, cb){
  var path = task.Path
    , ro   = {ok:true}
    , datetype = task.Type? task.Type : "amd";

  log.info(ro,
           "call function getDate (task, cb)");

  if(task.DocPath ){
    log.info(ro
            , "try to call query_cd function")
    utils.query_cd(task
                  , {
                    Result:[
                      {Type: datetype,
                       Value: utils.vl_date(),
                       Unit: "ms"}]}
                  , cb)
  }else{
    ro =  {error:"missing docpath"}
    log.error(ro
             , "task.DocPath is missing");
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
 */
var writeExchange = function (task, cb){
  var ro     = {ok:true}
    , path   = task.Path
    , path_b = [path[0]]
    , path_e = path_b.concat("exchange");

  log.info(ro,
           "call function writeExchange");

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
    mem.set(path_k, val, function (err){
      if(!err){
        log.info(ro,
                 "wrote " + key + " to Exchange")
        mem.publish("exchange", path_k, function (err){
          if(!err){
            log.info(ro,
                     "published to to exchange")
            if(_.isFunction (cb)){
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
        if(_.isFunction (cb)){
          cb(ro);
        }
      }
    });
  }else{
    ro = {error:"not a valid task"};
    log.error(ro, "missing  Key or Value")
    if(_.isFunction (cb)){
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
 */
var readExchange = function (task, cb){

  var ro     = {ok:true}
    , key    = task.Key
    , path   = task.Path;

  log.info(ro,
           "call function readExchange");

  if(key && path && _.isArray(path)){
    var path_b = [path[0]]
      , path_e = path_b.concat("exchange");

    if(task.Customer){
      key = deflt.cucoStr + "-" + key;
    }
    var path_d  = path_e.concat(key.split("."));
    mem.get(path_d, function (err, data){
      if(!err){
        if(_.isUndefined(data)){
          ro = {error:"nothing below give key"}
          log.error(ro,
                    "nothing below " + key)
          if(_.isFunction (cb)){
            cb(ro);
          }
        }else{
          var dR = data.Ready;
          // muss auch funktionieren, wenn es kein
          // data.Ready gibt:
          if( _.isUndefined(dR) || dR.value == true || dR.value == "true"){
            log.info(ro
                    , "receive ready; try getting data below " + path_d.join(" "));

            var valcoll = {};
            for(var k in data){
              log.info(ro
                      , "read" + data[k]);

              if(_.isObject(data[k]) && ! _.isUndefined(data[k].value) && data[k].save){

                if(data[k].type === "number"){
                  valcoll[k] = parseFloat(data[k].value);
                }else{
                  valcoll[k] = data[k].value;
                }
              }
            }
            log.info(ro
                    , "try storing data");
            if(!_.isEmpty(valcoll)){
              utils.query_cd(task
                            , {Result:[valcoll]}
                            , function (res){

                                if(res.ok){
                                  if(_.isUndefined(data.Ready)){
                                    if(_.isFunction (cb)){
                                      cb(ro);
                                    }
                                  }else{
                                    var path_r = path_d.concat(["Ready"]);
                                    mem.set(path_r, false, function (err){
                                      if(res.ok){
                                        log.info(ro
                                                , "reset exchange " + key + "Ready to false" );
                                        mem.publish("exchange", path_r, function (err){
                                          log.info(ro
                                                  , "publish to  exchange channel");
                                          if(!err){
                                            if(_.isFunction (cb)){
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
                                        if(_.isFunction (cb)){
                                          cb(ro);
                                        }
                                      }
                                    });
                                  }
                                }else{
                                  if(_.isFunction (cb)){
                                    cb(res);
                                  }
                                }
                              });
            }else{
              log.warn({warn:"no values"}
                      ,"the value collection is empty; it's ok maybe" );
              if(_.isFunction (cb)){
                cb(ro);
              }
            }
          }else{
            if(_.isFunction (cb)){
              setTimeout(function (){
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
              "missing  key or correct path to read from")
    if(_.isFunction (cb)){
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
 */



var getList = function (task, cb){
  var ro     = {ok:true}
    , con    = net.list(task)
    , path   = task.Path
    , path_e = [path[0], "exchange"];

  log.info(ro,
           "call function getList");

  request.exec(con, task, false, function(listdata){
    var path_t = task.ExchangePath;
    if(path_t  && path_t !== ""){
      var path_s = path_e.concat(path_t.split("."));
      mem.set(path_s, listdata, function (err){
        if(!err){
          mem.publish("exchange", path_s, function (err){
            if(!err){
              log.info(ro
                      , "wrote data to exchange");
              if(_.isFunction (cb)){
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
          if(_.isFunction (cb)){
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
 */
var checkDB = function (task, cb){

  var ro     = {ok:true}
    , con    = net.checkdb()
    , path   = task.Path
    , path_e = [path[0], "exchange"];


  log.info(ro,
           "call function checkDB");

  request.exec(con, task, false, function(dbinfo){
    var path_t = task.ExchangePath;
    if(path_t  && path_t !== ""){
      var path_s = path_e.concat(path_t.split("."));

      if(dbinfo.error){
        dbinfo.available = false;
      }else{
        dbinfo.available = false;
      }

      mem.set(path_s, dbinfo, function (err){
        if(!err){
          mem.publish("exchange", path_s, function (err){
            if(!err){
              log.info(ro
                      , "wrote data to exchange");
              if(_.isFunction (cb)){
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
          if(_.isFunction (cb)){
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
 * prüft die Verfügbarkeit des relay servers über
 * die ```task.Action``` ```_version```.
 * @method checkRelay
 * @param {Object} task Task-Objekt
 * @param {Function} cb Callback Funktion
 */
var checkRelay = function (task, cb){

  var ro     = {ok:true}
    , con    = net.relay()
    , path   = task.Path
    , path_e = [path[0], "exchange"]
    , tsk    = clone(task)
    , relayinfo;

  log.info(ro,
           "call function checkRelay");

  tsk.Action = "_version";
  request.exec(con, task, JSON.stringify(tsk), function (data){
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
        mem.set(path_s, relayinfo , function (err){
          if(!err){
            mem.publish("exchange", path_s, function (err){
              if(!err){
                log.info(ro
                        , "wrote data to exchange");
                if(_.isFunction (cb)){
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
            if(_.isFunction (cb)){
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
      if(_.isFunction (cb)){
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
 */
var updateCd = function (task, cb){

  var path = task.Path
    , mpid = path[0]
    , ro   = {ok:true};

  log.info(ro,
           "call function updateCd");

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
                      , function (last, id){
                          return function (updoc){
                            if(updoc._id){
                              var wrtcon    = net.wrtdoc(updoc._id)
                                , wrtdata   = JSON.stringify(updoc);
                              log.info(ro
                                      ,"try to write doc with id: " + id)
                              request.exec(wrtcon, task, wrtdata
                                          , function (res){
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
                              if(_.isFunction (cb)){
                                cb(ro)
                              }
                            }
                          }
                        }(i == N-1, id))
        }
      }else{
        log.warn({warn:"no cd id"}
                , "no calibration doc selected");
        if(_.isFunction (cb)){
          cb(ro)
        }
      }
    }else{
      ro = err
      log.error(ro
               , "error on attempt to get id interface");
      if(_.isFunction (cb)){
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
 */
var ctrlContainer = function (task, cb){
  var path   = task.Path
    , ro     = {ok:true}
    , mpid   = path[0]
    , path_b = [mpid]

  log.info(ro,
           "call function ctrlContainer");

  if(task.Value && _.isObject(task.Value)){
    var containers = _.keys(task.Value)
      , N = containers.length;

    for( var i = 0; i < N; i++ ){

      var no       = containers[i]
        , ctrlStr  = task.Value[no]
        , path_c   = [mpid, no, "ctrl"]

      mem.set(path_c, ctrlStr
             , function (last, n, c){
                 return function (err){
                   if(!err){
                     log.info(ro
                             , "set container: " + n + " to "+ c);
                   }else{
                     ro = {error:err}
                     log.info(ro
                             ,"error on attempt to set container: " + no + " to " + c);
                   }
                   if(last){
                     if(_.isFunction (cb)){
                       cb(ro);
                     }
                   }
                 }
               }(i == N-1, no, ctrlStr))
    } //for
  } // task.value
}


/**
 *
 * @method select
 * @param {Object} task Task-Objekt
 * @param {Function} cb Callback Funktion
 */
var select = function (task, cb){
  var path         = task.Path
    , ro           = {ok:true}
    , TaskDefClass = task.DefinitionClass


  if(TaskDefClass && path && _.isArray(path)){
    var mpid         = path[0]
      , no           = path[1]
      , take;

    mem.get([mpid, "definitions"], function(err, definitions){
      if(!err && definitions && _.isArray(definitions)){
        var dN =  definitions.length;
        for(var i = 0; i < dN; i++){

          if(definitions[i].DefinitionClass == TaskDefClass){

            for(var j = 0; j <  definitions[i].Condition.length; j++){
              (function(k, l){
                if(definitions[k].Condition){
                  var condobj = definitions[k].Condition[l]
                  if(condobj.Methode && compare[condobj.Methode] && condobj.Value && condobj.ExchangePath){


                    mem.get([mpid,"exchange"].concat(condobj.ExchangePath.split(".")), function(err, exval){
                      if(l == 0){
                        take = true;
                      }

                      take = take && compare[condobj.Methode](exval, condobj.Value);

                      if(l == definitions[k].Condition.length -1 && take){
                        log.info(ro
                                  , "found matching definition, try to load and run");
                        mem.publish("stop_container_obs", [mpid, no], function(err){
                          mem.set([mpid, no, "definition"], definitions[k].Definition, function(err){
                            mem.set([mpid, no, "ctrl"], ctrlstr.load + ";" + ctrlstr.run, function(err){
                              mem.publish("start_container_obs", [mpid, no], function(err){
                                  log.info(ro
                                          , "start observing container");
                                cb({end:true});
                              });
                            });
                          });
                        });
                      }else{
                        log.info(ro
                                  , "definition don't match conditions");
                      }
                    });
                  }else{
                    ro = {error:"unvalid condition"}
                    log.error(ro
                             , "Definitions contain a unvalid Condition");
                    if(_.isFunction(cb)){
                      cb(ro);
                    }
                  }
                }else{
                  // set and start container
                }
              })(i, j)
            }// for j
          }else{
            log.info(ro
                    , "investigated DefinitionClass " + definitions[i].DefinitionClass +
                     " don't match task demand " + TaskDefClass );
          }
        } // for i
      }else{
        ro = {error:"get definitions" }
        log.error(ro
                 , "error on attempt to get definitions");
        if(_.isFunction(cb)){
          cb(ro);
        }
      }
    }); // get definitions
  }else{
    ro = {error:"wrong task"}
    log.error(ro
             , "task contains no definition class key or unvalid path");
    if(_.isFunction(cb)){
      cb(ro);
    }
  }
}

exports.VXI11         = nodeRelay;
exports.TCP           = nodeRelay;
exports.UDP           = nodeRelay;

exports["/usr/bin/Rscript"] = nodeRelay;

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
exports.select        = select;
