var _        = require("underscore")
  , bunyan   = require("bunyan")
  , logStrm  = require("bunyan-couchdb-stream")
  , conf     = require("./conf")
  , broker   = require("sc-broker")
  , utils    = require("./utils")
  , log      = bunyan.createLogger({name: conf.app.name + ".utils.writeToExchange",
                                    streams: conf.log.streams
                                   })
  , mem      = broker.createClient({port: conf.mem.port})
  , ok       = {ok: true}
  , err;

/**
 * Die Funktion ```write_to_exchange()``` schreibt
 * übergebene Daten in die ```/exchange/pfad/zu/daten``` Schnittstelle.
 * Es gibt zwei Möglichkeiten wie der Pfad
 * ```.../pfad/zu/daten``` angegeben werden kann:
 * 1)  _key_ des ```data.ToExchange.pfad.zu.daten```
 * Bsp. (PostProcessing- Teil einer _task_):
 * ```
 * ...
 *  "PostProcessing": [
 *              "var _vec=_x.map(_.extractSRG3),",
 *               ...
 *              "ToExchange={'MKS-SRG-3-Ctrl-1-pressure.Type.value':'@token',
 *                           'MKS-SRG-3-Ctrl-1-pressure.Value.value':_res.mv,
 *                           'MKS-SRG-3-Ctrl-1-pressure.Unit.value':'mbar' };"
 *          ]
 * ```
 * Das hier angegeben ```PostProcessing``` liefert das ```data```
 * Objekt; ```pfad.zu.daten``` wäre hier z.B. ```MKS-SRG-3-Ctrl-1-pressure.Value.value```
 * 2) der Pfad wird einfach mit dem key ```Task.ExchangePath``` vorher
 * in der _task_ angegeben; alle Daten die von der _task_
 * geliefert werden, werden dann an diese Stelle geschrieben.
 * Bsp. (vollst. _task_):
 * ```
 *    {
 *            "Action": "getList",
 *            "Comment": "Remove an Element from Elements and Exchange",
 *            "TaskName": "get_calib_select",
 *            "ViewName": "calibrations",
 *            "ListName": "select",
 *            "Params": {
 *                "key": "@standard-@year"
 *            },
 *            "ExchangePath": "Documents"
 *        }
 * ```
 * Die Daten die die DB-Abfrage liefert sind (von der _list_-Funktion
 * so  aufbereitet, dass sie als Gesamtheit nach ```/exchange```
 * geschrieben werden können.
 * Gibt es unter dem Pfad ```Task.ExchangePath``` schon eine Struktur,
 * wird diese um die Übergebne erweitert.
 * @method write_to_exchange
 * @param {Object} task Task-Objekt
 * @param {Object} data zu schreibende Daten
 * @param {Array} path
 * @param {Function} cb Callback Funktion
 */
module.exports = function (task, data, cb){
  var exval
    , path      = task.Path
    , mpid      = path[0]
    , fromdata  = _.isObject(data.ToExchange)
    , fromtask  = _.isString(task.ExchangePath);
   
  if(!fromtask && !fromdata){
    err = new Error("no data src");
    log.error(err
             , "neither task nor data contains data to write")
    if(_.isFunction (cb)){
      cb(err);
    }
  }else{
    if(_.isEmpty(path)){
      log.warn({warn: "empty path"})
      if(_.isFunction (cb)){
        cb(null, data);
      }
    }else{
      if(fromdata){
        var i,
            tedata = data.ToExchange,
            ks     = _.keys(tedata),
            Nks    = ks.length;

        log.trace(ok
                , "found " + Nks + " key(s)");

        for(i = 0; i < Nks; i++){
          var val_exch  = data.ToExchange[ks[i]]
            , path_exch = [mpid, "exchange"].concat(ks[i].split("."));

          mem.set( path_exch, val_exch, (function (last, path_exch){
                                           return function (err){
                                             if(!err){
                                               mem.publish("exchange", path_exch, function (err){
                                                 if(!err){
                                                   log.trace(ok
                                                           , "wrote data to exchange");
                                                 }else{
                                                   log.error(err
                                                            , "error on publishing to exchange channel")
                                                   if(_.isFunction (cb)){
                                                     cb(err);
                                                   }
                                                 }
                                               }); // publish exchange
                                             }else{
                                               log.error(err
                                                        , "attempt to write to exchange");
                                             }
                                             if(last && _.isFunction (cb)){
                                               log.trace(ok
                                                       , "wrote all data to exchange");
                                               cb(null, ok);
                                             }
                                           }}(i == Nks -1, path_exch )));
        } // for
      } // fromdata

      if(fromtask){
        var path_tsk  = task.ExchangePath.split(".")
          , path_exch = [mpid, "exchange"].concat(path_tsk);
        mem.get(path_exch, function (err, exch_val){

          if(!err){
            var val_exch;
            if(exch_val){
              val_exch = _.extend(exch_val, data);
            }else{
              val_exch = data;
            }

            mem.set(path_exch, val_exch, function (err){
              if(!err){
                mem.publish("exchange", path_exch, function (err){
                  if(!err){
                    log.trace(ok
                            , "wrote data to exchange");
                    if(_.isFunction (cb)){
                      cb(null, ok);
                    }
                  }else{
                    log.error(err
                             , "error on publishing to exchange channel")
                    if(_.isFunction (cb)){
                      cb(err);
                    }
                  }
                }); // publish exchange
              }else{
                log.error(err
                         , "attempt to write to exchange");
                if(_.isFunction (cb)){
                  cb(err);
                }
              }
            });
          }else{
            log.error(err
                     , "error on getting values from "
                     + task.ExchangePath);
            if(_.isFunction (cb)){
              cb(err);
            }
          }
        }); // get exval
      } // fromtask
    }
  }
};
