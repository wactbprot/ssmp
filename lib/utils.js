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

/**
 * Die Function ```data_to_doc()```
 * schreibt Daten in Dokumente und ruft den callback
 * (in aller Regel ```save(doc)```)
 * mit dem so aufgefüllten Dokument auf.
 * Ein Beispiel für ein gültiges dataset ist:
 * ```
 * {Result:
 * [
 *   {
 *    Type:"a",         |
 *    Unit:"b",         | Datenobjekten 0
 *    Value:1,          |
 *    Comment:"bla"     |
 *   },
 *   {
 *    Type:"c",         |
 *    Unit:"d",         | Datenobjekten 1
 *    Value:2,          |
 *    Comment:"blu"     |
 *   }
 * ]
 * }
 * ```
 * @method data_to_doc
 * @param {Object} doc Dokument (Kalibrierdokument)
 * @param {Array} path
 * @param {Object} data Datenobjekten
 * @param {Function} cb Callback Funktion
 */
var data_to_doc = function (doc, path, data, cb){
  var data_result = data.Result
    , ro          = ok;

  if(data_result && _.isArray(data_result) && data_result.length > 0 ){
    var Nds     = data_result.length;
    log.info(ok
            , "found "+ Nds + " data sets to store to path " + path );

    for(var i = 0; i < Nds; i++){
      var doc_struct   = op.get(doc, path)
        , data_struct  = data_result[i]
        , pos          = -1
        , ppos         = 0;
      if(_.isString(data_struct.Type)){ // write Type, Value, Unit- Structures

        if((_.isNull(data_struct.Value) || _.isNumber(data_struct.Value) || _.isString(data_struct.Value)) &&
           _.isString(data_struct.Unit)){

          if(_.isUndefined(doc_struct)){
            op.set(doc, path, [])
          }

          if(_.isArray(doc_struct)){
            for(var k = 0; k < doc_struct.length; k++){
              var path_c = [path, k, "Type"].join(".")
              if(data_struct.Type == op.get(doc, path_c)){
                pos = k;
              }
            } // for
            if(pos < 0){
              pos = k;
            }
          }else{
            pos = 0;
          }
          op.ensureExists(doc, [path, pos].join("."), {});

          // ----- Type
          op.set(doc, [path, pos, "Type"].join("."), data_struct.Type);

          // ----- Unit
          op.set(doc, [path, pos, "Unit"].join("."), data_struct.Unit);

          // ----- Value
          var doc_struct_value = op.get(doc, [path, pos, "Value"].join("."));
          if(_.isArray(doc_struct_value)){
            ppos = doc_struct_value.length;
          }else{
            op.set(doc, [path, pos, "Value"].join("."), []);
            ppos = 0;
          }
          op.set(doc, [path, pos, "Value", ppos].join("."), data_struct.Value);

          // ----- Comment
          if(data_struct.Comment){
            var doc_struct_comment = op.get(doc, [path, pos, "Comment"].join("."))
            if(!_.isArray(doc_struct_comment)){
              op.set(doc, [path, pos, "Comment"].join("."), []);
            }
            // ppos wird von value genommen
            op.set(doc, [path, pos, "Comment", ppos].join("."), data_struct.Comment);
          }

          // ----- SdValue
          if(data_struct.SdValue){
            var doc_struct_sdvalue = op.get(doc, [path, pos, "SdValue"].join("."))
            if(!_.isArray(doc_struct_sdvalue)){
              op.set(doc, [path, pos, "SdValue"].join("."), []);
            }
            // ppos wird von value genommen
            op.set(doc, [path, pos, "SdValue", ppos].join("."), data_struct.SdValue);
          }

          // ----- N
          if(data_struct.N){
            var doc_struct_n = op.get(doc, [path, pos, "N"].join("."))
            if(!_.isArray(doc_struct_n)){
              op.set(doc, [path, pos, "N"].join("."), []);
            }
            // ppos wird von value genommen
            op.set(doc, [path, pos, "N", ppos].join("."), data_struct.N);
          }

        }else{ // wrong value structure
          err = new Error( "wrong data structure");
          log.error(err
                   ,"wrong data structure")
          cb(err)
        }

      }else{// write stuff like Gas, okpk ...

        if(_.isObject(data_struct)){
          for(var j in data_struct){
            op.set(doc, [path, j].join("."), data_struct[j]);
          }
        }
        if(_.isString(data_struct) || _.isNumber(data_struct) || _.isBoolean(data_struct)){
          op.set(doc, path, data_struct);
        }
      }

      if(i == Nds - 1){
        log.info(ok
                , "exec call back in data_to_doc");
        cb(null, doc)
      }
    }//for
  }else{
    err = new Error("wrong dataset structure");
    log.error(err
             , "the test on data.Result failed");
    cb(err);
  }
};
exports.data_to_doc = data_to_doc;

/**
 * Die Funktion ```query_cd()``` holt
 * ein Kalibrierdokument (aka KD
 * oder cd: calibration document) von der Datenbank
 * ruft die Funktion ```data_to_doc()``` auf und
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
      if(task.DocPath){

        var Id      = task.Id,
            docpath = task.DocPath,
            Nid     = Id.length;

        for(var i = 0; i < Nid; i++){
          var rdcon  = net.rddoc(Id[i]);
          (function(i){
            var delay = i*deflt.system.db_delay_mult
            setTimeout(function(){
             log.info(ok
                     ,"start doc request for data save with delay of "
                     + delay + " ms");
              request.exec(rdcon, task, false, function (last){
                                                 return function (err, doc){
                                                   if(err){
                                                     if(_.isFunction (cb)){
                                                       cb(err);
                                                     }
                                                   }else{
                                                     log.info(ok,
                                                              "get doc try to store date in it");
                                                     data_to_doc(doc, docpath, data
                                                                , function (err, filled_doc){
                                                                    if(!err){
                                                                      log.info(ok
                                                                              ,"doc filled up with date try to store back");
                                                                      var wrtcon = net.wrtdoc(filled_doc._id);
                                                                      request.exec(wrtcon, task, JSON.stringify(filled_doc)
                                                                                  , function (err, res){
                                                                                      if(err){
                                                                                        err = new Error("error on attempt to save doc");
                                                                                        log.error(err
                                                                                                 , "error on attempt to save doc");
                                                                                        if(_.isFunction (cb)){
                                                                                          cb(err);
                                                                                        }
                                                                                      }
                                                                                      if(res.ok){
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
                                                                               , "data_to_doc returns execs cb witherror");

                                                                    }
                                                                  });
                                                   }
                                                 } // doc ok
                                               }(i === Nid -1));
            }, delay);
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
