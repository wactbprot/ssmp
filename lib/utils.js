var _        = require("underscore")
  , bunyan   = require("bunyan")
  , ndata    = require('ndata')
  , fs       = require("fs")
  , op       = require("object-path")
  , net      = require("./net")
  , deflt    = require("./default")
  , request  = require("./request")
  , log      = bunyan.createLogger({name: deflt.app.name + ".utils"})
  , ctrlstr  = deflt.ctrlStr
  , mem      = ndata.createClient({port: deflt.mem.port})
  , ok       = {ok: true}
  , err

var dataToDoc = require("./utils.dataToDoc");

/**
 * Macht aus dem geschachtelten State Object ein
 * flaches Array
 * @method as_arr
 * @param {Object} o state array
 */
var as_arr = function (o){
  if(_.isObject(o) && _.isObject(o['0'])){
    return _.flatten(_.map(o, function (v, k){
                       return _.map(v,function (vv, kk){
                                return vv})
                     }));
  }else{
    return false;
  }
};
exports.as_arr = as_arr;

/**
 * Gibt true zurück, wenn
 * alle Array Elemente val sind sonst false
 * @method all_same
 * @param {} arr
 * @param {} val
 */
var all_same =  function (arr, val){
  if(_.isArray(arr) && _.isString(val)){
    return  _.every(arr, function (i){
              return i == val;
            });
  }else{
    return false;
  }
}
exports.all_same = all_same;

/**
 * Description
 * @method pad0
 * @param {Number} n
 * @return ConditionalExpression
 */
var pad0 = function (n){
  return n < 10 ? "0" + n : n;
};

/**
 * Description
 * @method vl_date
 * @param {String} dstr
 * @return BinaryExpression
 */
var vl_date = function (dstr){
  var dt = dstr ? new Date(dstr) : new Date()
    , Y = dt.getFullYear()
    , M = pad0(dt.getMonth() + 1)
    , D = pad0(dt.getDate())
    , h = pad0(dt.getHours())
    , m = pad0(dt.getMinutes());
  return Y + '-' + M + '-' + D + " " + h+":" + m;
};
exports.vl_date = vl_date;

/**
 * Description
 * @method vl_time
 * @param {String} dstr
 * @return BinaryExpression
 */
var vl_time = function (dstr){
  var dt = dstr ? new Date(dstr) : new Date();
  return "" + dt.getTime();
};
exports.vl_time = vl_time;

var request_cd = function(task, id, data,  last, cb){
  request.exec(net.rddoc(id), task, false
              , function (err, doc){
                  if(err){
                    if(_.isFunction (cb)){
                      cb(err);
                    }
                  }else{
                    log.info(ok,
                             "get doc try to store date in it");
                    dataToDoc(doc, task.DocPath, data
                               , function (err, doc){
                                   if(!err && doc._id){
                                     log.info(ok
                                             ,"doc filled up with date try to store back");

                                     request.exec(net.wrtdoc(id), task, JSON.stringify(doc)
                                                 , function (err, res){
                                                     if(err){
                                                       if(err.message == "conflict"){
                                                         var delay = Math.random()*1000;

                                                         log.warn(err
                                                                 , "conflict on attempt "
                                                                 + "to save doc, retry in (random): "
                                                                 + delay + "ms");
                                                         // write data again
                                                         setTimeout(function(){
                                                           request_cd(task, id, data,  last, cb);
                                                           log.warn(ok
                                                                   , "delay time "
                                                                   + delay + "ms over,  "
                                                                   + "retry to save doc");
                                                         }, delay);
                                                       }else{
                                                         err = new Error("error on attempt to save doc");
                                                         log.error(err
                                                                  , "error on attempt to save doc");
                                                         if(_.isFunction (cb)){
                                                           cb(err);
                                                         }
                                                       }
                                                     }else{
                                                       log.info(res
                                                               ,"save doc with id: "
                                                                 + res.id);
                                                       if(last){
                                                         log.info(ok
                                                                 ,"saved all docs");
                                                         if(_.isFunction (cb)){
                                                           cb(null, res);
                                                         }
                                                       }
                                                     }
                                                   });
                                   }else{
                                     log.error(err
                                              , "dataToDoc returns execs cb witherror");
                                   }
                                 });
                  }
                });
}

/**
 * Die Funktion ```query_cd()``` holt
 * ein Kalibrierdokument (aka KD
 * oder cd: calibration document) von der Datenbank
 * ruft die Funktion ```dataToDoc()``` auf und
 * übergibt dieser Funktion als callback den Auftrag
 * zum wieder Abspeichern des nun aufgefüllten cd.
 * @method query_cd
 * @param {Object} task Task-Objekt
 * @param {Object} data Objekt mit Result key
 * @param {Function} cb Callback Funktion
 */
var query_cd = function (task, data, cb){
  var ro;
  if( task && _.isObject(task)){

    if(task.Id && task.Id.length  > 0){
      // todo: wo wird was getestet; wo data, wo docpath noch ...
     if(task.DocPath){
        var Id      = task.Id,
            Nid     = Id.length;
        for(var i = 0; i < Nid; i++){
          (function(j){
            request_cd(task, Id[j], data, j == Nid -1, cb);
          })(i);
        } // for
      }else{
        err = new Error("with given data");
        log.error(err
                 , "test on task.DocPath  failed");
        if(_.isFunction (cb)){
          cb(err);
        }
      }
    }else{
      log.warn({warn:"no or empty Id array"},
               "seems to be a test; no calibration doc selected");
      if(_.isFunction (cb)){
        cb(null
          , {ok:true, warn: "empty Id array"});
      }
    }
  }else{
    err = new Error("no task");
    log.error(err
             , "test on task failed");
    if(_.isFunction (cb)){
      cb(err);
    }
  }
};
exports.query_cd = query_cd;

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
var write_to_exchange = function (task, data, cb){
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

        log.info(ok
                , "found " + Nks + " key(s)");

        for(i = 0; i < Nks; i++){
          var val_exch    = data.ToExchange[ks[i]]
            , path_exch = [mpid, "exchange"].concat(ks[i].split("."));

          mem.set( path_exch, val_exch, (function (last, path_exch){
                                           return function (err){
                                             if(!err){
                                               mem.publish("exchange", path_exch, function (err){
                                                 if(!err){
                                                   log.info(ok
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
                                               log.info(ok
                                                       , "wrote all data to exchange");
                                               cb(null, ok);
                                             }
                                           }}(i == Nks -1, path_exch )));
        } // for
      } // fromdata

      if(fromtask){
        var path_tsk = task.ExchangePath.split(".")
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
                    log.info(ok
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
                     , "error on getting values from "+ task.ExchangePath);
            if(_.isFunction (cb)){
              cb(err);
            }
          }
        }); // get exval
      } // fromtask
    }
  }
};
exports.write_to_exchange = write_to_exchange;

/**
 * Die Funktion kopiert die Struktur ```template```
 * und erzeugt eine genauso strukturiertes
 * Objekt initialisiert
 * es mit ```inival``` und ruft ```cb``` damit auf
 *
 * @method cp
 * @param {Array} template Strukturvorlage
 * @param {String} inival Inertialer Wert
 * @param {Function} cb callback Funktion
 */
var cp = function (template, inival, cb){
  if(template && _.isObject(template)){
    var k = _.keys(template)
      , iN = k.length
      , res = {};

    for(var i = 0; i < iN; i++){
      var e =  template[k[i]]
      if(e && _.isObject(e)){
        var kk = _.keys(e)
          , jN = kk.length;
        res[k[i]] = {};

        for(var j = 0; j < jN; j++){
          res[k[i]][kk[j]] = inival;
          if(i == iN -1 && j == jN -1 && _.isFunction(cb)){
            cb(null, res);
          }
        }
      }else{
        if(_.isFunction(cb)){
          err = new Error("template undefined");
          cb(err);
        }
      }
    }
  }else{
    if(_.isFunction(cb)){
      err = new Error("wrong template");
      cb(err);
    }
  }
};
exports.cp = cp;

/**
 * Ersetzt in task token mit value
 * @method replace_in_with
 * @param {Object} inObject (z.B. Task)
 * @param {String} token   (z.B. @waittime)
 * @param {Array|String} value
 * @return task
 */
var replace_in_with = function (inObj, token, value){

  var strinObj = JSON.stringify(inObj),
      patt    = new RegExp( token ,"g");

  if(_.isArray(value) || _.isObject(value)){
    strinObj = strinObj.replace(patt, JSON.stringify(value))
               .replace(/\"\[/g, "\[")
               .replace(/\]\"/g, "\]")
               .replace(/\"\{/g, "\{")
               .replace(/\}\"/g, "\}");
  }

  if(_.isString(value) || _.isNumber(value)|| _.isBoolean(value)){
    strinObj  = strinObj.replace(patt, value);
  }

  strinObj  = strinObj.replace(/\r/g, "\\r");
  strinObj  = strinObj.replace(/\n/g, "\\n");

  return JSON.parse(strinObj);
}
exports.replace_in_with = replace_in_with;


/**
 * Ersetzt in task token mit value
 * @method replace_in_with
 * @param {Object} inObject
 * @param {Object} replObject
 * @param {Function} callback wird mit inObject aufgerufen
 */
var replace_all = function (inObj, replObj, cb){
  if(replObj && _.isObject(replObj)){
    var k  = _.keys(replObj)
      , v  = _.values(replObj)
      , Nk = k.length;
    for(var i = 0; i < Nk; i++){
      inObj = replace_in_with(inObj, k[i], v[i]);

      if(i == Nk -1){
        cb(inObj);
      }
    }
  }else{
    cb(inObj);
  }
}
exports.replace_all = replace_all;

/**
 * Stellt json als js-object bereit.
 *
 * @param {} path
 * @return ret
 */
var ret    = {};
var get_jsn = function(path){
  var ff = fs.readdirSync(path);
  if(ff && ff.length > 0){
    for(var i = 0; i < ff.length; i++){

      var cf    = ff[i],
          cpath = path + cf,
          cstat = fs.lstatSync(cpath),
          pat   = /\.json$/;

      if(cstat.isFile() && cf.search(pat) > -1){
        var jname   = cf.replace(pat, "") // z.B.: main
          , jsn    = JSON.parse(fs.readFileSync(cpath, "utf-8"));
        ret[jname] = jsn;
      }
    }
  }
  return ret;
}
exports.get_jsn = get_jsn;
