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
 *  	   {
 *  	    "Action": "wait",
 *          "Comment": "_waitfor  _waittime ms",
 *  	    "TaskName": "wait",
 *  	    "Value": {
 *  	             "WaitTime": "_waittime"
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
    http     = require("http"),
    clone    = require("clone"),
    deflt    = require("./default"),
    utils    = require("./utils"),
    net      = require("./net"),
    receive  = require("./receive"),
    gen      = require("./generic"),
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
  if(task.Value          &&
     task.Value.WaitTime){

    setTimeout(function(){
      cb("ok");
    }, parseInt(task.Value.WaitTime,10))
  }else{
    cb("error")
  }
};

/**
 * (Mess-) Aufträge an den _node-relay_-server
 * werden an diesen mit der ```noderelay()```
 * Funktion gesandt. Eine erfolgreiche Antwort (```data```)
 * wird der Funktion ```receive()``` übergeben.
 *
 * @param {Object} mp Messprog.-Objekt
 * @param {Object} task Task-Objekt
 * @param {Array} pfad Pfad Array
 * @param {Function} cb Callback Funktion
 *
 */
var noderelay = function(mp, task, path, cb){
  var data,
      con = net.relay(mp),
      jt  = JSON.stringify(task);

  var  req = http.request(con, function(res) {
               res.setEncoding("utf8");
               res.on("data", function (d) {
                 data = JSON.parse(d);

                 if(data.error){
                     log.error({error: data.error},
                               "receive error from " + task.TaskName + " request");
                     cb("error");
                   }else{
                     log.info({ok: true},
                              "receive data from " + task.TaskName + " request");
                     receive(mp, task, path, data, cb);
                   }
               });
               res.on("end", function(){
                 log.info("end of " + task.TaskName + " request")
               });
               res.on("error", function(e){
                 cb("error");
                 log.error({error:e}, "response failed")
               });
             });

  req.on("error", function(e) {
    cb("error");
    log.error({error:e}, "request failed")
  });

  req.write(jt);
  req.end();
};

/**
 * Die worker Funktion ```addElement()``` erlaubt es,
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
var addElement = function(mp, task, path, cb){
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
      log.info({ok:true}, "wrote " + key + " to Exchange")
      cb("ok");
    });
  }else{
    cb("error");
    log.error({error:"not a valid task"}, "missing  Key or Value")
  }
};

/**
 * Die worker Funktion ```readElement()``` erlaubt es,
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
 * Mir der Funktion  ```readElement()```
 * wird (wenn ```...Ready:true```) der Wert aus
 * ```exchange[task.key]``` zerlegt
 * und all die Elemente, bei denen das Attribut ```save```
 * zu ```true``` evaluiert wird
 * (z.B. ```exchange.calibration-pressure.Unit.save:true```
 * in die entsprechenden  Kalibrierdokument geschrieben.
 *
 *
 * @param {Object} mp Messprog.-Objekt
 * @param {Object} task Task-Objekt
 * @param {Array} pfad Pfad Array
 * @param {Function} cb Callback Funktion
 */
var readElement = function(mp, task, path, cb){

  if(task.Key){
    var  key       = task.Key;
    if(task.CuCo){
      key = deflt.cucoStr + "-" + key;
    }
    var datapath = key.split("."),
        data =  mp.exchange.get(datapath);

    if(_.isUndefined(data)){
      cb("error");
      log.error({error:"struct missing"},
                "nothing below " + key)
    }else{
      if(data.Ready &&
         (data.Ready == true || data.Ready == "true")){

        var o = {};
        for(var k in data){

          if(_.isObject(data[k]) &&
           ! _.isUndefined(data[k].value) &&
             data[k].save){
            if(data[k].type === "number"){
              o[k] = parseFloat(data[k].value);
            }else{
              o[k] = data[k].value;
            }
          }
        }
        log.info({ok:true},
                 "try storing data")

        utils.query_cd(mp, task, {Result:[o]}, function(res){
          if(res === "ok"){
            var readypath = (key + "." + "Ready").split(".");
            mp.exchange.set(readypath, false, function(res){
              if(res.ok){
                log.info({ok:true},
                         "reset exchange."+ key + "." + "Ready to false" );
                if(_.isFunction(cb)){
                  cb("ok");
                }
              }else{
                log.info({error:"reset ready flag"},
                         " error on reset exchange."+ key + "." + "Ready" );
                if(_.isFunction(cb)){
                  cb("error");
                }
              }
            });
          }else{
            if(_.isFunction(cb)){
              cb(res);
            }
          }
         });
      }else{
        if(_.isFunction(cb)){
          cb("again");
        }
      }
    }
  }else{
    log.error({error:"not a valid task"},
              "missing  key to read from")
    if(_.isFunction(cb)){
      cb("error");
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

  if(task.Value &&
     task.Value.RecipeClass){
    var rclass = task.Value.RecipeClass,
        rcps   = mp.recipes.get([]),
        take   = false,
        pos    = clone(path).shift();

    for(var i = 0; i < rcps.length; i++){
      var rcp = rcps[i];
      if(rcp.RecipeClass === rclass){
        log.info({ok:true}, "found recipe class")
        var conds = rcp.Conditions;
        take  = true;
        for(var j = 0; j < conds.length; j++){
          var cond = conds[j];
          if(cond.ExchangePath &&
             cond.Value &&
             cond.Methode){
            var exchval = mp.exchange.get(cond.ExchangePath),
                condval = cond.Value;

            if(_.isUndefined(exchval)){
              take = false;
              break;
            }else{
              take = take && compare[cond.Methode](exchval, condval);
            }
          }
        }

        if(take){
          log.info({ok:true}, "found matching recipe")
          cb("ok");
          clearInterval(mp.timerid.get([pos]));
          mp.timerid.set([pos], 0, function(){
            mp.definition.del([pos], function(){
                mp.recipe.del([pos], function(){
                  log.info({ok:true}, "sync def and state: " + pos);
                  mp.definition.set([pos], rcp.Definition, function(){
                    gen.setstate(mp, pos, rcp.Definition, ctrlstr.ready, function(){
                      mp.ctrl.set([pos], "load;" + mp.ctrl.get([pos]), function(){
                        log.info({ok:true}, "load matching recipe")
                      });
                    });
                  });
                });
            });
          });
          break;
        }
      }
    } // for
    if(!take){
      log.error({error:"no recipe"}, "no recipe matches the conditions");
      cb("error")
    }
  }else{
    cb("error");
    log.error({error:"recipe class missing"}, "don't know which RecipeClass to look for")
  }
};

/**
 * Die worker Funktion ```getList()```
 * holt Daten von einer Datenbank-List-Abfrage.
 * Die ```task``` benötigt die Einträge  ```task.ListName```
 * und ```task.ViewName```. Ergebnisse werden (wie schon beim
 * ```noderelay()``` worker) der ```receive()```-Funktion übergeben.
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
  var opts     = net.list(mp, task);

  if(task.Params){
    opts.params = task.Params;
  }

  net.dbcon(mp).relax(opts, function(err, data){
    if(_.isObject(data)){ // task ok
      log.info({ok: true}, "try to receive data from /"
                         + task.ListName
                         + "/"
                         + task.ViewName)
      receive(mp, task, path, data, cb);
    }
    if(err){
      cb("error")
      log.error({error:"request failed"}, err)
    }
  }); // view: get tasks by name

}


exports.VXI11        = noderelay;
exports.TCP          = noderelay;
exports.UDP          = noderelay;

exports.wait         = wait;
exports.addElement   = addElement;
exports.readElement  = readElement;
exports.select       = select;
exports.getList      = getList;