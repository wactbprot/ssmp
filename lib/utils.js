var _        = require("underscore")
  , bunyan   = require("bunyan")
  , ndata    = require('ndata')
  , op       = require("object-path")
  , net      = require("./net")
  , deflt    = require("./default")
  , request  = require("./request")
  , log      = bunyan.createLogger({name: deflt.appname})
  , ctrlstr  = deflt.ctrlStr
  , mem      = ndata.createClient({port: 9000});

/**
 * Die ```cmd_to_array()``` Funktion zerlegt die
 * unter ```Mp.Container[i].Ctrl``` bzw. ```http://.../mpid/ctrl```
 * angebbaren Steuerzeichen (_cmdstr_) und erzeugt daraus eien Array,
 * dessen erstes Feld den aktuellen Auftrag (load, run etc.)
 * beinhaltet; die Funktion ```observe()``` benutzt dieses erste Feld,
 * um entsprechende Funktionen auszuwählen.
 * Wenn der _cmdstr_ so aussieht:
 * ```
 * "load;run;stop"
 * ```
 * soll:
 * ```
 * ["load","run", "stop"]
 * ```
 * erzeugt werden. Sieht der _cmdstr_wie folgt aus:
 * ```
 * "load;2:run,stop"
 * ```
 * soll:
 * ```
 * ["load","run", "stop","run", "stop"]
 * ```
 * erzeugt werden. Steht an lezter Stelle der String ```mon```
 * wird immer wieder ```["mon"]``` zurückgeliefert.
 * @method cmd_to_array
 * @param {String} cmdstr Steuerstring
 * @return
 */
var cmd_to_array = function(cmdstr){
  var arr = [],
      al1 = cmdstr.split(";");
  if( al1.length === 1 && al1[0] ===  ctrlstr.mon){
    return [ ctrlstr.mon];
  }else{
    for(var i = 0; i < al1.length; i++){
      var al2 = al1[i].split(":");

      if(al2.length > 1){
        var rep    = parseInt(al2[0],10);
        if(_.isNumber(rep)){
          for(var j = 0; j < rep; j++){
            _.map(al2[1].split(","), function(c){arr.push(c)});
          }
        }
      }else{
        arr.push(al1[i]);
      }
    }
    return arr;
  }
};
exports.cmd_to_array = cmd_to_array;

/**
 * Macht aus dem geschachtelten State Object ein
 * flaches Array
 * @method as_arr
 * @param {Object} o state array
 * @return
 */
var as_arr = function(o){
  if(_.isObject(o) && _.isObject(o['0'])){
  return _.flatten(_.map(o, function(v, k){
                     return _.map(v,function(vv, kk){
                              return vv})
                   })
                  );
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
 * @return
 */
var all_same =  function(arr, val){
  if(_.isArray(arr) && _.isString(val)){
    return  _.every(arr, function(i){
              return i == val;
            });
  }else{
    return false;
  }
}
exports.all_same = all_same;


/**
 * Description
 * @method replace_in_with
 * @param {Object} task
 * @param {String} token
 * @param {String|Array} value
 * @return CallExpression
 */
var replace_in_with = function(task, token, value){

  var strtask = JSON.stringify(task),
      patt    = new RegExp( token ,"g");

  if(_.isArray(value)){
    strtask = strtask.replace(patt, JSON.stringify(value))
              .replace(/\"\[/g, "\[")
              .replace(/\]\"/g, "\]")
  }else{
    strtask  = strtask.replace(patt, value);
  }
  strtask  = strtask.replace(/\n/g, "\\n");
  strtask  = strtask.replace(/\r/g, "\\r");

  return JSON.parse(strtask);
}
exports.replace_in_with = replace_in_with;

/**
 * Description
 * @method pad0
 * @param {} n
 * @return ConditionalExpression
 */
var pad0 = function(n){
  return n < 10 ? "0" + n : n;
};

/**
 * Description
 * @method vl_date
 * @param {} dstr
 * @return BinaryExpression
 */
var vl_date = function(dstr){
  var dt = dstr ? new Date(dstr) : new Date(),
      Y = dt.getFullYear(),
      M = pad0(dt.getMonth() + 1),
      D = pad0(dt.getDate()),
      h = pad0(dt.getHours()),
      m = pad0(dt.getMinutes());
  return Y + '-' + M + '-' + D + " " + h+":" + m;
};
exports.vl_date = vl_date;

/**
 * Description
 * @method vl_time
 * @param {} dstr
 * @return BinaryExpression
 */
var vl_time = function(dstr){
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
 * @param {} path
 * @param {Object} data Datenobjekten
 * @param {Function} cb Callback Funktion
 * @return
 */
var data_to_doc = function(doc, path, data, cb){
  var ok          = {ok:true}
    , data_result =  data.Result
    , ro;

  if(data_result && _.isArray(data_result) && data_result.length > 0 ){

    var Nds     = data_result.length;

    log.info(ok
            , "found "+ Nds+" data sets to store" );

    for(var i = 0; i < Nds; i++){
      var doc_struct   = op.get(doc, path)
        , data_struct  = data_result[i]
        , pos          = -1
        , ppos         = 0;

      if(_.isUndefined(doc_struct)){
        op.set(doc, path, [])
      }

      if(_.isString(data_struct.Type)){      // write Type, Value, Unit- Structures

        if((data_struct.Value || _.isNull(data_struct.Value))  && _.isString(data_struct.Unit)){

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
          op.ensureExists(doc, [path, pos].join("."), {})

          op.set(doc, [path, pos, "Type"].join("."), data_struct.Type);
          op.set(doc, [path, pos, "Unit"].join("."), data_struct.Unit);

          var doc_struct_value = op.get(doc, [path, pos, "Value"].join("."));

          if(_.isArray(doc_struct_value)){
            ppos = doc_struct_value.length;
          }else{
            op.set(doc, [path, pos, "Value"].join("."), [])
            ppos = 0;
          }
          op.set(doc, [path, pos, "Value", ppos].join("."), data_struct.Value);

          if(data_struct.Comment){
            var doc_struct_comment = op.get(doc, [path, pos, "Comment"].join("."))
            if(!_.isArray(doc_struct_comment)){
              op.set(doc, [path, pos, "Comment"].join("."), [])
          }
            // ppos wird von value genommen
          op.set(doc, [path, pos, "Comment", ppos].join("."), data_struct.Comment);
        }
        }else{ // wrong value structure
          ro = {error: "wrong data structure"}
          log.error(ro,
                    "wrong or value, unit in data set")
console.log("----------------------------------___")
          cb(ro);
          break;
        }
      }else{
        for(var j in data_struct){
          // write stuff like Gas, okpk ...
          op.set(doc, [path, j].join("."), data_struct[j]);
        }

      }
    }//for

    if(_.isFunction(cb)){
      log.info(ok
              , "exec call back in data_to_doc");
      cb(doc)
    }
  }else{
    ro = {error:"wrong dataset structure"};
    log.error(ro
             , "the test on data.Result failed");
    cb(ro);
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
 * @return
 */
var query_cd = function(task, data, cb){
  var ro;

  if( task &&
      _.isObject(task)){

    if(task.Id         &&
       task.Id.length  > 0){

      if(task.DocPath){

        var Id      = task.Id,
            docpath = task.DocPath,
            Nid     = Id.length;

        for(var i = 0; i < Nid; i++){
          var rdcon  = net.rddoc(Id[i]);

          // (con, task, wrtdata, cb)
          request.exec(rdcon, task, false
                      ,function(last){
                         return function(doc){
                           log.info({ok:true},
                                    "get doc try to store date in it");
                           data_to_doc(doc, docpath, data
                                      , function(filled_doc){
                                          log.info({ok:true}
                                                  ,"doc filled up with date try to store back");
                                          var wrtcon = net.wrtdoc(filled_doc._id)
                                          // (con, task, wrtdata, cb)
                                          request.exec(wrtcon, task, JSON.stringify(filled_doc)
                                                      , function(res){
                                                          if(res.error){
                                                            log.error(res
                                                                     , "error on attempt to save doc");
                                                          }
                                                          if(res.ok){
                                                            log.info(res
                                                                    ,"save doc with id: "
                                                                    + res.id);
                                                          }
                                                          if(last){
                                                            log.info({ok:true}
                                                                    ,"saved all docs");
                                                            if(_.isFunction(cb)){
                                                              cb(res);
                                                            }
                                                          }
                                                        });
                                        });
                         }
                       }(i === Nid -1));
        }
      }else{
        ro = {error:"with given data"};
        log.error(ro
                 , "test on task.DocPath  failed");
        if(_.isFunction(cb)){
          cb(ro);
        }
      }
    }else{
      log.warn({warn:"no or empty Id array"},
               "seems to be a test; no calibration doc selected");
      if(_.isFunction(cb)){
        cb({ok:true
           , warn: "empty Id array"});
      }
    }
  }else{
    ro = {error:"no task"};
    log.error(ro
             , "test on task failed");
    if(_.isFunction(cb)){
      cb(ro);
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
 * @param {} path
 * @param {Function} cb Callback Funktion
 * @return
 */
var write_to_exchange = function(task, data, path, cb){
  var exval
    , ro        = {ok:true}
    , path_e    = [path[0]].concat(["exchange"])
    , ok        = false
    , fromdata  = _.isObject(data.ToExchange)
    , fromtask  = _.isString(task.ExchangePath);

  if(fromdata){
    var i,
        tedata = data.ToExchange,
        ks     = _.keys(tedata),
        Nks    = ks.length;

    log.info({ok:true}
            , "found " + Nks + " key(s)");
    ok = true;

    for(i = 0; i < Nks; i++){
      var path_k  = ks[i]
        , path_n = path_e.concat(path_k.split("."))
        , val    = data.ToExchange[path_k];
      mem.set(path_n, val, (function(last, path_l){
                              return function(err){
                                if(!err){
                                  mem.publish("exchange", path_l, function(err){
                                    if(!err){
                                      log.info(ro
                                              , "wrote data to exchange");
                                    }else{
                                      log.error({error: err}
                                               , "error on publishing to exchange channel")
                                    }
                                  }); // publish exchange
                                }else{
                                  log.error({error:err}
                                           , "attempt to write to exchange");
                                }
                                if(last && _.isFunction(cb)){
                                  log.info(ro
                                          , "wrote all data to exchange");
                                  cb(ro);
                                }
                              }}(i == Nks -1, path_n )));
    } // for
  } // fromdata

  if(fromtask){
    mem.get( path_e, function(err, exval){
      if(!err){
        ok   = true;
        var path_t = task.ExchangePath.split(".")
          , path_n = path_e.concat(path_t)
          , val;
        if(exval){
          val = _.extend(exval, data);
        }else{
          val = data;
        }
        mem.set(path_n , val, function(err){

          if(!err){
            mem.publish("exchange", path_n, function(err){
              if(!err){
                log.info(ro
                        , "wrote data to exchange");
              }else{
                log.error({error: err}
                         , "error on publishing to exchange channel")
              }
            }); // publish exchange
          }else{
            ro = {error:err}
            log.error(ro
                     ,"attempt to write to exchange");
          }
          if(_.isFunction(cb)){
            cb(ro);
          }
        });
      }else{
        log.error({error:err}
                 , "error on getting values from "+ task.ExchangePath);
      }
    }); // get exval
  } // fromtask

  if(!ok){
    ro = {error:"data exchange"};
    log.error(ro
             , "find path/data neither in data nor in task");
    if(_.isFunction(cb)){
      cb(ro);
    }
  }
};
exports.write_to_exchange = write_to_exchange;

/**
 * Die Funktion kopiert die Struktur ```template```
 * und erzeugt eine genauso strukturiertes
 * Objekt unter ```path``` und initialisiert
 * es mit ```val```
 * @method cp
 * @param {} path
 * @param {Array} template Strukturvorlage
 * @param {String} val Inertialer Wert
 * @param {Function} cb callback Funktion
 * @return
 */
var cp = function(path, template, val, cb){

  var k = _.keys(template)
    , iN = k.length;

  for(var i = 0; i < iN; i++){
    var e = template[k[i]]
      , kk = _.keys(e)
      , jN = kk.length;
    for(var j = 0; j < jN; j++){
      var lpath = path.concat([ i, j]);
      mem.set(lpath, val, function(last){
                            return function(err){
                              if(last){
                                cb()
                              }
                            }}(i == iN -1 && j == jN -1));
    }
  }
};
exports.cp = cp;