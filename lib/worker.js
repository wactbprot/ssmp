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
  , log      = bunyan.createLogger({name: deflt.app.name})
  , mem      = ndata.createClient({port: deflt.mem.port})
  , ro       = {ok: true}
  , err
/**
 * ```wait()``` verzögert den Ablauf um die unter
 * ```task.WaitTime``` angegebene Zeit in ms.
 * Defaultwert ist eien Wartezeit von 1000ms
 * @method wait
 * @param {Object} task Task-Objekt
 * @param {Function} cb Callback Funktion
 */
var wait = function(task, cb){
  var path = task.Path
    , wt   = task.WaitTime
    , nwt

  log.info(ro,
           "call function wait");

  if(_.isUndefined(wt)){
    log.warn({warn:"no wait time"}
            , "no wait time given, wait 1 sec");
    nwt  = 1000;
  }

  if(_.isString(wt)){
    log.info(ro
            , "try to parse wait time");
    nwt  = parseInt(wt, 10);
  }

  if(_.isNaN(nwt)){
    err = new Error( "not a number");
    log.error(err
             , "can not parse waittime to number");
    if(_.isFunction (cb)){
      cb(err);
    }
  }else{
    setTimeout(function (){
      log.info(ro,
               "waittime over");
      if(_.isFunction (cb)){
        cb(null, ro);
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
  var path    = task.Path;

  log.info(ro,
           "call function nodeRelay"
              + "try request to nodeRelay");
  if(path && _.isArray(path)){
    var con     = net.relay()
      , wrtdata = JSON.stringify(task);

    request.exec(con, task, wrtdata, function (err, data){
      if(!data && err){
        log.error(err
                 , "received error in callback");
        cb(err);
      }
      if(data){
        log.info(ro
                , "request callback succesful");
        if(data.ok){
          log.info(ro
                  , " exec callback with simple ok");
          cb(null, data);
        }else{
          var dp = task.DocPath    && task.DocPath    !== ""
            , ep = data.ToExchange && data.ToExchange !== ""
            , rr = data.Result     && data.Result     !== "";

          if(dp && ep){
            log.info(ro
                    , "found DocPath and ToExchange, try to save");
            utils.query_cd(task, data, function (err, res){
              if(!err){
                log.info(ro,
                         "try to write to exchange");
                utils.write_to_exchange(task, data, cb);
              }else{
                log.error(err,
                          "try to write to exchange");
                cb(err);
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
            utils.write_to_exchange(task, data, cb)

          } //!dp && ep

          if(!dp && !ep && rr){
            log.info(ro,
                     "simple pass with Result: "
                        + JSON.stringify(data.Result));
            cb(null, ro);
          } //!dp && ep
        } // else data.ok
      } // data.error
    });
  }else{
    err = new Error("wrong path")
    log.error(err,
              "missing path or path is not an array");
    if(_.isFunction(cb)){
      cb(err);
    }
  }
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
  var type     = task.Type ? task.Type : "amt"
    , timeobj  = {Type: type,
                  Value: utils.vl_time(),
                  Unit: "ms"}

      , dp = task.DocPath
    , ep = task.ExchangePath

  log.info(ro,
           "call function gettime");

  if(dp && !ep){
    log.info(ro
            , "try to call query_cd function")
    utils.query_cd(task,  {Result:[timeobj]}, cb)
  }

  if(ep && !dp){
    log.info(ro
            , "try to call write_to_exchange function");
    utils.write_to_exchange(task,  timeobj, cb);
  }

  if(ep && dp){
    log.info(ro
            , "try to call write_to_exchange"
            + " function and query_cd function");
    utils.write_to_exchange(task,  timeobj, function(err){
      if(!err){
        utils.query_cd(task,  {Result:[timeobj]}, cb);
      }else{
        cb(err);
      }
    });
  }

  if(!ep && !dp){
    err = new Error("missing value");
    log.error(err
             , "missing exchangePath or DocPath");
    cb(err);
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
  var path     = task.Path
    , datetype = task.Type ? task.Type : "amd"
    , dp       = task.DocPath
    , ep       = task.ExchangePath
    , dateobj  = {Type: datetype,
                  Value: utils.vl_date()};

  log.info(ro,
           "call function gettime");

  if(dp && !ep){
    log.info(ro
            , "try to call query_cd function")
    utils.query_cd(task, {Result:[ dateobj]}, cb)
  }

  if(ep && !dp){
    log.info(ro
            , "try to call write_to_exchange function");
    utils.write_to_exchange(task,  dateobj, cb);
  }

  if(ep && dp){
    log.info(ro
            , "try to call write_to_exchange"
            + " function and query_cd function");
    utils.write_to_exchange(task,  dateobj, function(err){
      if(!err){
        utils.query_cd(task, {Result:[ dateobj]}, cb);
      }else{
        cb(err);
      }
    });
  }

  if(!ep && !dp){
    err = new Error("missing value");
    log.error(err
             , "missing exchangePath or DocPath");
    cb(err);
  }
}

/**
 * Die worker Funktion ```writeExchange()``` erlaubt es,
 * zur Laufzeit Einträge in der _exchange_-Schnittstelle
 * zu erstellen.
 * Anwendungsbeispiel: Ein Messgerät kann nicht
 * elektronisch ausgelesen werden; es müssen manuelle
 * Eingabefelder zur Laufzeit erstellt werden.
 *
 * @method writeExchange
 * @param {Object} task Task-Objekt
 * @param {Function} cb Callback Funktion
 */
var writeExchange = function (task, cb){
  var path   = task.Path
    , exch   = task.ExchangePath
    , val    = task.Value;

  log.info(ro,
           "call function writeExchange");

  if(val && exch && path && _.isArray(path) && _.isString(exch)){
    if(task.Customer){
      exch = deflt.misc.custDevPrefix + "-" + exch;
    }
    utils.write_to_exchange(task, val, cb);
  }else{
    err = new Error("not a valid task");
    log.error(err
             , "missing  ExchangePath or Value")
    if(_.isFunction (cb)){
      cb(err);
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
 * zurückgesandt. Der Client muss dann den key ```Ready```
 * auf true setzen
 * (Bsp.: ```exchange.calibration-pressure.Ready:true```).
 * Mit der Funktion  ```readExchange()```
 * wird (wenn ```data.Ready:true``` oder es kein
 * ```data.Ready``` gibt) der Wert aus
 * ```exchange[Task.Key]``` zerlegt
 * und die Schlüssel Value, Unit, Type, SdValue und N
 * in die entsprechenden  Kalibrierdokumente geschrieben.
 * @method readExchange
 * @param {Object} task Task-Objekt
 * @param {Function} cb Callback Funktion
 */
var readExchange = function (task, cb){
  var ro     = {ok:true}
    , key      = task.ExchangePath
    , runif    = task.RunIf
    , path     = task.Path;

  log.info(ro,
           "call function readExchange");

  if(key && path && _.isArray(path)){
    var mpid = path[0];

    if(task.Customer){
      key = deflt.cucoStr + "-" + key;
    }

    mem.get([mpid, "exchange"].concat(key.split(".")), function (err, data){

      if(!err){
        if(_.isUndefined(data)){
          err = new Error("nothing below give key");
          log.error(err
                   , "nothing below " + key)
          if(_.isFunction (cb)){
            cb(err);
          }
        }else{ // data is defined
          var valcoll = {};
          if(_.isObject(data)){
            for(var k in data){
              if(k != "Caption" || k != "Label"){
                log.info(ro
                        , "read " + k);
                if(k == "Value" || k == "SdValue" || k == "N"){
                  valcoll[k] = parseFloat(data[k]);
                }else{
                  valcoll[k] = data[k];
                }
              }
            } // for
          } // if object
          if(_.isString(data) || _.isNumber(data)){
            valcoll = data;
          }
          if(!_.isEmpty(valcoll)){
            log.info(ro
                    , "non empty value collection; try to store");

            utils.query_cd(task, {Result:[valcoll]}, function (err, res){
              if(!err){
                if(_.isUndefined(data.Ready)){
                  if(_.isFunction (cb)){
                    cb(null, ro);
                  }
                }else{
                  if(runif && _.isString(runif)){
                    mem.set([mpid, "exchange"].concat(runif.split(".")), false, function (err){
                      if(res.ok){
                        log.info(ro
                                , "reset exchange." + runif + "to false" );
                        mem.publish("exchange", [mpid,"exchange"].concat(runif.split(".")), function (err){
                          log.info(ro
                                  , "publish to  exchange channel");
                          if(!err){
                            if(_.isFunction (cb)){
                              cb(null, ro);
                            }
                          }else{
                            log.error(err
                                     , "on attempt to publish to exchange channel");
                          }
                        });
                      }else{
                        err = new Error("reset ready flag");
                        log.info(err
                                , " error on reset exchange." + runif );
                        if(_.isFunction (cb)){
                          cb(err);
                        }
                      }
                    });
                  }else{
                    log.warn({warn:"no RunIf"}
                            , "No RunIf key, can not set to false therefore");
                  }
                }
              }else{
                err = new Error("error on query_cd");
                log.error(err
                         , "error on query_cd()" );

                if(_.isFunction (cb)){
                  cb(err);
                }
              }
            }); // query_cd
          }else{
            log.warn({warn: "no values"}
                    ,"the value collection is empty; it's ok maybe");
            if(_.isFunction (cb)){
              cb(null, ro);
            }
          }
        }
      } // if get exch err
    }); // get data from exchange
  }else{
    err = new Error("not a valid task");
    log.error(err
             , "missing  key or correct path to read from")
    if(_.isFunction (cb)){
      cb(err);
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
  var ro       = {ok:true}
    , path     = task.Path
    , exchpath = task.ExchangePath

  log.info(ro,
           "call function getList");

  if(path && _.isArray(path) && exchpath && _.isString(exchpath)){
    var mpid = path[0]
      , con  = net.list(task)

    request.exec(con, task, false, function(err, data){
      if(!err){
        utils.write_to_exchange(task, data, cb);
      }else{
        log.error(err
                 , "error in request cb")
        if(_.isFunction (cb)){
          cb(err);
        }
      }
    });
  }else{
    err = new Error("wrong path")
    log.error(err
             , "path missing or is not an array")
    if(_.isFunction (cb)){
      cb(err);
    }
  }
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
  var ro       = {ok:true}
    , path     = task.Path;

  if(path && _.isArray(path) ){
    var con  = net.checkdb()
      , mpid = path[0];
    log.info(ro,
             "call function checkDB");
    request.exec(con, task, false, function(err, dbinfo){

      if(err){
        dbinfo.available = false;
      }else{
        dbinfo.available = false;
      }

      utils.write_to_exchange(task, dbinfo, cb);
    });
  }else{
    err = new Error("wrong path");
    log.error(err
             , "path missing or is not an array")
    if(_.isFunction (cb)){
      cb(err);
    }
  }
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

  var ro       = {ok:true}
    , exchpath = task.ExchangePath
    , path     = task.Path
  log.info(ro,
           "call function checkRelay");
  if(path && _.isArray(path) && exchpath && _.isString(exchpath)){
    var con    = net.relay()
      , tsk    = clone(task)
      , mpid   = path[0]
      , relayinfo

    tsk.Action = "_version";
    request.exec(con, task, JSON.stringify(tsk), function (err, data){
      if(data && data.Result){
        relayinfo = {version: data.Result
                    , available: true};
      }

      if(err){
        relayinfo = {error: err.message
                    , available: false};
      }
      utils.write_to_exchange(task, relayinfo, cb);
    });
  }else{
    err = new Error("unvalid task");
    log.error(err
             , "task is not valid")
    if(_.isFunction (cb)){
      cb(err);
    }
  }
};

/**
 * Holt KDs, über update list und schreibt KD zurück.
 * @method updateCd
 * @param {Object} task Task-Objekt
 * @param {Function} cb Callback Funktion
 */
var updateCd = function (task, cb){
  var path = task.Path
    , ro   = {ok:true};

  log.info(ro,
           "call function updateCd");
  if(path && _.isArray(path)){
    var mpid   = path[0];

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
            request.exec(net.list(task), task, false, function (last, id){
                                                        return function (err, updoc){
                                                          if(updoc._id){
                                                            var wrtcon    = net.wrtdoc(updoc._id)
                                                              , wrtdata   = JSON.stringify(updoc);
                                                            log.info(ro
                                                                    ,"try to write doc with id: " + id)
                                                            request.exec(wrtcon, task, wrtdata, function (err, res){
                                                              if(res.ok){
                                                                log.info(ro
                                                                        ,"doc with id: " + res.id + " got new revision "
                                                                        +  res.rev + " on storing");
                                                                if(last){
                                                                  cb(null, res);
                                                                }
                                                              }else{
                                                                err = new Error("update request");
                                                                log.error(err
                                                                         , "while try to save updated doc")
                                                              }
                                                            });
                                                          }else{
                                                            err = new Error("update request");
                                                            log.error(err
                                                                     , "object returned by db has no _id property")
                                                            if(_.isFunction (cb)){
                                                              cb(err)
                                                            }
                                                          }
                                                        }
                                                      }(i == N-1, id))
          }
        }else{
          log.warn({warn:"no cd id"}
                  , "no calibration doc selected");
          if(_.isFunction (cb)){
            cb(null, ro)
          }
        }
      }else{
        log.error(err
                 , "error on attempt to get id interface");
        if(_.isFunction (cb)){
          cb(err)
        }
      }
    }); // get short doc objects
  }else{
    err = new Error("unvalid task");
    log.error(err
             , "task is not valid")
    if(_.isFunction (cb)){
      cb(err);
    }
  }
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
    , val    = task.Value
  log.info(ro,
           "call function ctrlContainer");

  if(path && _.isArray(path) && val && _.isObject(val)){
    var containers = _.keys(val)
      , N          = containers.length
      , mpid       = path[0];

    for( var i = 0; i < N; i++ ){
      var no       = containers[i]
      mem.set([mpid, no, "ctrl"], task.Value[no], function (last, n, c){
                                                    return function (err){
                                                      if(!err){
                                                        log.info(ro
                                                                , "set container: "
                                                                + n + " to "
                                                                + c);
                                                        if(last){
                                                          if(_.isFunction (cb)){
                                                            cb(null, ro);
                                                          }
                                                        }
                                                      }else{
                                                        log.info(err
                                                                ,"error on attempt to set container: "
                                                                + n + " to "
                                                                + c);
                                                         if(_.isFunction (cb)){
                                                            cb(err);
                                                         }
                                                      }
                                                    }
                                                  }(i == N-1, no, task.Value[no]))
    } //for
  }else{
    err = new Error("unvalid task");
    log.error(err
             , "task is not valid");
    if(_.isFunction (cb)){
      cb(err);
    }
  }
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
                  if(condobj.Methode && compare[condobj.Methode] &&  !_.isUndefined(condobj.Value) && condobj.ExchangePath){

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
                                cb(null, {end:true});
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
                    err = new Error("unvalid condition");
                    log.error(err
                             , "Definitions contain a unvalid Condition");
                    if(_.isFunction(cb)){
                      cb(err);
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
        err = new Error("get definitions");
        log.error(err
                 , "error on attempt to get definitions");
        if(_.isFunction(cb)){
          cb(err);
        }
      }
    }); // get definitions
  }else{
    err = new Error("wrong task");
    log.error(err
             , "task contains no definition class key or unvalid path");
    if(_.isFunction(cb)){
      cb(err);
    }
  }
}

exports.nodeRelay     = nodeRelay;
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
