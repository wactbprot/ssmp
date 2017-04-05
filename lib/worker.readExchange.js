/**
 * @module work.readExchange
 */
var _        = require("underscore")
  , bunyan   = require("bunyan")
  , broker   = require("sc-broker")
  , conf     = require("./conf")
  , utils    = require("./utils")
  , log      = bunyan.createLogger({name: conf.app.name + ".worker.readExchange",
                                    streams: conf.log.streams
                                   })
  , mem      = broker.createClient({port: conf.mem.port})
  , ro       = {ok: true}
  , err;

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
module.exports = function (task, cb){
  var key      = task.ExchangePath
    , runif    = task.RunIf
    , path     = task.Path;

  log.trace(ro,
           "call function readExchange");

  if(key && path && _.isArray(path)){
    var mpid = path[0];

    if(task.Customer){
      key = conf.misc.custDevPrefix + "-" + key;
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
                log.trace(ro
                        , "read " + k);
                if(k == "Value" || k == "SdValue" || k == "N"){
                  var numVal = parseFloat(data[k])
                  valcoll[k] = numVal ? numVal : data[k];
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
            log.trace(ro
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
                      if(!err){
                        log.trace(ro
                                , "reset exchange." + runif + "to false" );
                        mem.publish("exchange", [mpid,"exchange"].concat(runif.split(".")), function (err){
                          log.trace(ro
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
                        log.trace(err
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
