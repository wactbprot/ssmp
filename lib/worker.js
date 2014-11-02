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
 *          "Value": {
 *                   "WaitTime": "_waittime"
 *                   }
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
 * @author wactbprot (thsteinbock@web.de)
 */

var _        = require("underscore"),
    bunyan   = require("bunyan"),
    clone    = require("clone"),
    deflt    = require("./default"),
    utils    = require("./utils"),
    net      = require("./net"),
    request  = require("./request"),
    gen      = require("./generic"),
    walk     = require("./walk"),
    compare  = require("./compare"),
    log      = bunyan.createLogger({name: deflt.appname}),
    ctrlstr  = deflt.ctrlStr;

/**
 * ```wait()``` verzögert den Ablauf um die unter
 * ```task.Value.WaitTime``` angegebene Zeit in ms.
 *
 * @param {Object} mp Messprog.-Objekt
 * @param {Object} task Task-Objekt
 * @param {Array} path Pfad Array
 * @param {Function} cb Callback Funktion
 */
var wait = function(mp, task, path, cb){
  var ro;
  if(task.Value          &&
     task.Value.WaitTime){

    setTimeout(function(){
      ro = {ok:true};
      log.info(ro,
               "waittime over");
      if(_.isFunction(cb)){
        cb(ro);
      }
    }, parseInt(task.Value.WaitTime,10))
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
 * werden an diesen mit der ```noderelay()```
 * Funktion gesandt.
 *
 * @param {Object} mp Messprog.-Objekt
 * @param {Object} task Task-Objekt
 * @param {Array} pfad Pfad Array
 * @param {Function} cb Callback Funktion
 *
 */
var noderelay = function(mp, task, path, cb){

  var ro,
      con     = net.relay(mp),
      wrtdata = JSON.stringify(task);

  ro = {ok:true};
  log.info(ro,
           "try request to noderelay");

  // (mp, con, task, path, wrtdata, cb)
  request.exec(mp, con, task, path,  wrtdata, function(data){

    log.info({ok:true},
             "request callback");
    var dp = task.DocPath    && task.DocPath    !== ""
      , ep = data.ToExchange && data.ToExchange !== "";

    if(dp && ep){
      log.info({ok:true},
               "found DocPath and ToExchange, try to save");
      utils.query_cd(mp, task, path, data, function(res){
        if(res.ok){
          log.info({ok:true},
                   "try to write to exchange");
          utils.write_to_exchange(mp, task, data, cb);
        }else{
          ro = {error:"in call back of query_cd"}
          log.error(ro,
                    "try to write to exchange");
          cb(ro);
        }
      })
    } // dp & ep

    if(dp && !ep){

      log.info({ok:true},
               "found DocPath and Results try to save");
      utils.query_cd(mp, task, path, data, cb)
    } // dp && !ep

    if(!dp && ep){
      log.info({ok:true},
               "found ToExchange, try to exchange");
      utils.write_to_exchange(mp, task, data, cb)

    } //!dp && ep
  });
};

/**
 * Die worker Funktion ```writeExchange()``` erlaubt es,
 * zur Laufzeit Einträge in der _exchange_-Schnittstelle
 * zu erstellen.
 *
 * Anwendungsbeispiel: Ein Messgerät kann nicht
 * elektronisch ausgelesen werden; es müssen manuelle
 * Eingabefelder erstellt werden. Dazu ist
 * ```addElement()``` gedacht.
 *
 * @param {Object} mp Messprog.-Objekt
 * @param {Object} task Task-Objekt
 * @param {Array} pfad Pfad Array
 * @param {Function} cb Callback Funktion
 */
var writeExchange = function(mp, task, path, cb){
  var ro;
  if(task.Value &&
     task.Key){

    // alles nach exchange,
    // unter elems nur noch path zu
    // exchange
    var prob,
        exchObj   = {},
        key       = task.Key,
        val       = task.Value;

    if(task.CuCo){
      key = deflt.cucoStr + "-" + key;
    }
    mp.exchange.set(key.split("."), val, function(){
      ro = {ok:true}
      log.info(ro,
               "wrote " + key + " to Exchange")
      if(_.isFunction(cb)){
        cb(ro);
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
 *
 * Anwendungsbeispiel: Ein Messgerät kann nicht
 * elektronisch ausgelesen werden; es sind Eingabefelder
 * erstellt, ausgefüllt und vom Client an _exchange_
 * zurückgesandt. Der Client muss dann den key ```Ready```
 * auf true setzen
 * (Bsp.: ```exchange.calibration-pressure.Ready:true```).
 *
 * Mir der Funktion  ```readExchange()```
 * wird (wenn ```data.Ready:true``` oder es kein
 * ```data.Ready``` gibt) der Wert aus
 * ```exchange[Task.Key]``` zerlegt
 * und all die Elemente, bei denen das Attribut ```save```
 * zu ```true``` evaluiert wird
 * (z.B. ```exchange.calibration-pressure.Unit.save:true```
 * in die entsprechenden  Kalibrierdokumente geschrieben.
 *
 *
 * @param {Object} mp Messprog.-Objekt
 * @param {Object} task Task-Objekt
 * @param {Array} pfad Pfad Array
 * @param {Function} cb Callback Funktion
 */
var readExchange = function(mp, task, path, cb){
  var key = task.Key,
      ro;

  if(key){
    if(task.CuCo){
      key = deflt.cucoStr + "-" + key;
    }
    var datapath = key.split(".");
    mp.exchange.get(datapath, function(data){

      if(_.isUndefined(data)){
        ro = {error:"struct missing"}
        log.error(ro,
                  "nothing below " + key)
        if(_.isFunction(cb)){
          cb(ro);
        }
      }else{

        if( _.isUndefined(data.Ready) || data.Ready == true || data.Ready == "true"){
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
          log.info({ok:true}
                  , "try storing data")
          if(!_.isEmpty(valcoll)){
            utils.query_cd(mp, task, path, {Result:[valcoll]}, function(res){

              if(res.ok){
                if(_.isUndefined(data.Ready)){
                  ro = {ok:true};
                  if(_.isFunction(cb)){
                    cb(ro);
                  }
                }else{
                  var readypath = (key + "." + "Ready").split(".");
                  mp.exchange.set(readypath, false, function(res){
                    if(res.ok){
                      ro = {ok:true};
                      log.info(ro
                              , "reset exchange."
                              + key
                              + "."
                              + "Ready to false" );
                      if(_.isFunction(cb)){
                        cb(ro);
                      }

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
 * Die worker Funktion ```select()``` wählt auf Basis
 * der unter _exchange_ derzeitig vorhandenen Werte
 * (z.B. ```target_pfill.Value.value```
 * ein Folgerezept für den aufrufenden Container aus.
 * In der ```task``` muss die Rezeptklasse unter dem Pfad
 * ```task.Value.RecipeClass``` gegeben sein.
 *
 * @param {Object} mp Messprog.-Objekt
 * @param {Object} task Task-Objekt
 * @param {Array} pfad Pfad Array
 * @param {Function} cb Callback Funktion
 */

var select = function(mp, task, path, cb){
  var ro;
  // --- rewrite if can be tested
  // dont work for the moment
  // because of async get recipe conditions

  if(task.Value &&
     task.Value.RecipeClass){
    var rclass = task.Value.RecipeClass;

    mp.recipes.get([],function(rcps){
      var take   = false
        , pos    = clone(path).shift();

      for(var i = 0; i < rcps.length; i++){
        var rcp = rcps[i];
        if(rcp.RecipeClass === rclass){
          log.info({ok:true}
                  , "found recipe class")
          var conds = rcp.Conditions;
          take  = true;
          for(var j = 0; j < conds.length; j++){
            var cond = conds[j];
            if(cond.ExchangePath &&
               cond.Value &&
               cond.Methode){

              mp.exchange.get(cond.ExchangePath, function(exchval){
                var condval = cond.Value;

                if(_.isUndefined(exchval)){
                  take = false;
                }else{
                  take = take && compare[cond.Methode](exchval, condval);
                }
              }); // exchpath
            }
          }
          if(take){
            ro = {ok:true};
            log.info(ro
                    , "found matching recipe")
            mp.definition.del([pos], function(){
                mp.recipe.del([pos], function(){
                  log.info(ro
                          , "sync def and state: " + pos);
                  mp.definition.set([pos], rcp.Definition, function(){
                    walk.setstate(mp, pos, rcp.Definition, ctrlstr.ready, function(){
                      mp.ctrl.get([pos], function(oldctrl){
                        mp.ctrl.set([pos], ctrlstr.load + ";" + oldctrl, function(){
                          log.info(ro
                                  , "load matching recipe")
                          if(_.isFunction(cb)){
                            cb(ro);
                          }
                        });
                      });
                    });
                  });
                });
              });

            break;
          } // take
        } // if rclass
      } // for
      if(!take){
        ro = {error:"no condition match"};
        log.error(ro,
                  "no recipe matches the conditions");
        if(_.isFunction(cb)){
          cb(ro)
        }
      }
    });  // get recipe
  }else{
    ro = {error:"recipe class missing"};
    log.error(ro,
              "don't know which RecipeClass to look for")
    if(_.isFunction(cb)){
      cb(ro)
    }
  }
};

/**
 * Die worker Funktion ```getList()```
 * holt Daten von einer Datenbank-List-Abfrage.
 * Die ```task``` benötigt die Einträge  ```task.ListName```
 * und ```task.ViewName```.
 *
 * Anwendungnsbeispiel: Datensätze zur Auswahl
 * eines Kalibrierdokuments.
 *
 * @param {Object} mp Messprog.-Objekt
 * @param {Object} task Task-Objekt
 * @param {Array} pfad Pfad Array
 * @param {Function} cb Callback Funktion
 */
var getList = function(mp, task, path, cb){

  var ro, con = net.list(mp, task);

  // (mp, con, task, path, wrtdata, cb)
  request.exec(mp, con, task, path, false
              , function(listdata){
                  var tep = task.ExchangePath;

                  if(tep  && tep !== ""){
                    mp.exchange.set(tep.split("."), listdata
                                   ,function(){
                                      ro = {ok:true}
                                      log.info(ro
                                              , "wrote list data to Exchange")
                                      if(_.isFunction(cb)){
                                        cb(ro);
                                      }
                                    });

                  }else{
                    log.error({error: "receive list data"}
                             , "don't know what todo with received data: "
                             + JSON.stringify(listdata));
                  }
                })
};

/**

 *
 * @param {Object} mp Messprog.-Objekt
 * @param {Object} task Task-Objekt
 * @param {Array} pfad Pfad Array
 * @param {Function} cb Callback Funktion
 */
var updateCd = function(mp, task, path, cb){

  mp.id.get([], function(sd){

    var ro,
        ids = _.keys(sd),
        N   = ids.length;

    for(var i = 0; i < N; i++){

      var id     = ids[i];
      log.info({ok:true}
                             ,"try to update: "
                             + id)
                     task.Param = {id: id};
                     var getcon = net.list(mp, task);
                     // (mp, con, task, path, wrtdata, cb)
                     request.exec(mp, getcon, task, path, false
                                 , function(last, id){
                                     return function(updoc){
                                       if(updoc._id){
                                         var wrtcon    = net.wrtdoc(mp, updoc._id)
                                           , wrtdata   = JSON.stringify(updoc);
                                         log.info({ok:true}
                                                 ,"try to write doc with id: "
                                                 + id)
                                         // (mp, con, task, path, wrtdata, cb)
                                         request.exec(mp, wrtcon, task, path,  wrtdata

                                                     , function(res){
                                                         if(res.ok){
                                                           log.info({ok:true}
                                                                   ,"doc with id: "
                                                                   + res.id
                                                                   + " got new revision "
                                                                   +  res.rev
                                                                   + " on storing")
                                                           if(last){
                                                             cb(res);
                                                           }
                                                         }else{
                                                           ro = {error:"update request"};
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
  }); // get short doc objects
}

  /**
   * Die worker Funktion ```ctrlContainer```
   * erlaubt es taskgesteuert den ctrl-String
   * von Containern zu setzen. Ein Anwendungsbeispiel
   * ist das Starten des Initialisierungscontainers
   * nachdem die KD-ids ausgewählt wurden.
   *
   *
   * @param {Object} mp Messprog.-Objekt
   * @param {Object} task Task-Objekt
   * @param {Array} pfad Pfad Array
   * @param {Function} cb Callback Funktion
   */
var ctrlContainer = function(mp, task, path, cb){
  var ro;
  if(task.Value &&
     _.isObject(task.Value)){

    var containers = _.keys(task.Value)
      ,N = containers.length;

    for( var i = 0; i < N; i++ ){

      var container = containers[i]
        ,ctrlStr  = task.Value[container];

      mp.ctrl.set([container], ctrlStr
                 ,function(last){
                    return function(res){
                      if(res.ok){

                        log.info(res
                                ,"set container: "
                                +  container
                                + " to "
                                + ctrlStr);

                      }else{
                        log.info(res
                                ,"error on try to  set container: "
                                +  container
                                + " to "+ ctrlStr);
                      }
                      if(last){
                        if(_.isFunction(cb)){
                          cb(res);
                        }
                      }
                    }
                  }(i == N-1))
    } //for
  } // task.value
}

exports["/usr/local/bin/vxiTransceiver"]       = noderelay;
exports.VXI11         = noderelay;
exports.TCP           = noderelay;
exports.UDP           = noderelay;

exports.wait          = wait;
exports.writeExchange = writeExchange;
exports.readExchange  = readExchange;
exports.select        = select;
exports.getList       = getList;
exports.ctrlContainer = ctrlContainer
exports.updateCd      = updateCd
