var _        = require("underscore")
  , bunyan   = require("bunyan")
  , ndata    = require('ndata')
  , net      = require("./net")
  , col      = require("./collections")
  , deflt    = require("./default")
  , gen      = require("./generic")
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
 *
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
 *
 * @param {String} cmdstr Steuerstring
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

var as_arr = function(s){
  return _.flatten(_.map(s, function(v, k){
                     return _.map(v,function(vv, kk){
                              return vv})
                   })
                  );
};
exports.as_arr = as_arr;

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

var get_path = function(req){
  var path   = [],
      id     = req.params.id,
      no      = req.params.no,
      s      = req.params.struct,
      l1     = req.params.l1,
      l2     = req.params.l2,
      l3     = req.params.l3;
 
  if(id && no){
    path = [id, no];
    if(s){
      path = path.concat(s);
      if(l3 && l2 && l1){
        path = path.concat([l1, l2, l3]);
      }
      if(l2 && l1 && !l3){
        path = path.concat([l1, l2]);
      }
      if(l1 && !l2 && !l3){
        path = path.concat([l1]);
      }
    }
  }
  return path;
}
exports.get_path = get_path;

var pad0 = function(n){
  return n < 10 ? "0" + n : n;
};

var vlDate = function(dstr){
  var dt = dstr ? new Date(dstr) : new Date(),
      Y = dt.getFullYear(),
      M = pad0(dt.getMonth() + 1),
      D = pad0(dt.getDate()),
      h = pad0(dt.getHours()),
      m = pad0(dt.getMinutes());
  return Y + '-' + M + '-' + D + " " + h+":" + m;
};
exports.vlDate = vlDate;

var vlTime = function(dstr){
  var dt = dstr ? new Date(dstr) : new Date();

  return "" + dt.getTime();
};
exports.vlTime = vlTime;

/**
 * Die Function ```data_to_doc()```
 * schreibt Daten in Dokumente und ruft den callback
 * (in aller Regel ```save(doc)```)
 * mit dem so aufgefüllten Dokument auf.
 *
 * Ein Beispiel für ein gültiges dataset ist:
 * ```
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
 * ```
 *
 * @param {Object} doc Dokument (Kalibrierdokument)
 * @param {String} pfad  punktseparierter Pfadstring
 * @param {Array} dataset Array mit Datenobjekten
 * @param {Function} cb Callback Funktion
 */
var data_to_doc = function(doc, path, data, cb){

  if(data                   &&
     data.Result            &&
     _.isArray(data.Result) &&
     data.Result.length > 0 ){

    var dmod    = gen.mod(doc),
        Nds     =  data.Result.length;

    log.info({ok:true},
             "found "+ Nds+" data sets to store" );

    for(var i = 0; i < Nds; i++){
      dmod.get(path, function(dv){
        var dat  = data.Result[i],
            pos  = -1,
            ppos = 0;

        // write Type, Value, Unit- Structures
        if(dat.Type  &&
           dat.Value &&
           dat.Unit ){

          if(_.isUndefined(dv)){
            dmod.set(path, [])
          }

          if(_.isArray(dv)){
            for(var k = 0; k < dv.length; k++){
              dmod.get([path, k, "Type"].join("."), function(dattype){
                if(dat.Type === dattype){
                  pos = k;
                }
              });
            }
            if(pos < 0){
              pos = k;
            }
          }else{
            pos = 0;
          }

          dmod.ensure([path, pos].join("."), {})
          // --*-- Type --*--
          dmod.set([path, pos, "Type"].join("."), dat.Type);
          // --*-- Unit --*--
          dmod.set([path, pos, "Unit"].join("."), dat.Unit);

          // --*-- Value --*--
          dmod.get([path, pos, "Value"].join("."), function(dvv){
            if(_.isArray(dvv)){
              ppos = dvv.length;
            }else{
              dmod.set([path, pos, "Value"].join("."), [])
              ppos = 0;
            }

            dmod.set([path, pos, "Value", ppos].join("."), dat.Value);
          }); // get dvv

          // --*-- Comment --*--
          if(dat.Comment){

            dmod.get([path, pos, "Comment"].join("."), function(dvc){

              if(!_.isArray(dvc)){
                dmod.set([path, pos, "Comment"].join("."), [])
              }
              // ppos wird von value genommen
              dmod.set([path, pos, "Comment", ppos].join("."), dat.Comment);
            }); // get dvc
          }

        }else{
          for(var j in dat){
            // write stuff like Gas, okpk ...
            dmod.set([path, j].join("."), dat[j]);
          }
        }
      }); //get dv
    }//for

    if(_.isFunction(cb)){
      log.info({ok:true}
              ,"exec call back in data_to_doc");
      dmod.get([], cb);
    }
  }else{
    log.error({error:"no data sets given"}
             ,"the test on data.Result failed");
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
 *
 * @param {Object} mp Messprog.-Objekt
 * @param {Object} task Task-Objekt
 * @param {Array} path state-Pfad
 * @param {Object} data Objekt mit Result key
 * @param {Function} cb Callback Funktion
 */
var query_cd = function(mp, task, path, data, cb){
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
          var rdcon  = net.rddoc(mp,  Id[i]);

          // (mp, con, task, path, wrtdata, cb)
          request.exec(rdcon, task, false
                      ,function(last){
                         return function(doc){
                           log.info({ok:true},
                                    "get doc try to store date in it");
                           data_to_doc(doc, docpath, data
                                      , function(filled_doc){
                                          log.info({ok:true}
                                                  ,"doc filled up with date try to store back");
                                          var wrtcon = net.wrtdoc(mp, filled_doc._id)
                                          // (mp, con, task, path, wrtdata, cb)
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
 *
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
 *
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
 *
 * Gibt es unter dem Pfad ```Task.ExchangePath``` schon eine Struktur,
 * wird diese um die Übergebne erweitert.
 *
 * @param {Object} mp Messprog.-Objekt
 * @param {Object} task Task-Objekt
 * @param {Object} data zu schreibende Daten
 * @param {Function} cb Callback Funktion
 */

var write_to_exchange = function(mp, task, data, cb){
  var exval,value, path, ro, ok = false,
      fromdata = _.isObject(data.ToExchange),
      fromtask = _.isString(task.ExchangePath);

  if(fromdata){
    var i,
        tedata = data.ToExchange,
        ks     = _.keys(tedata),
        Nks    = ks.length;

    log.info({ok:true}
            , "found "
             + Nks
             + " key(s)");
    ok = true;

    for(i = 0; i < Nks; i++){
      var epath = ks[i];
      value     = data.ToExchange[epath];
      path      = epath.split(".");

      mp.exchange.set(path ,value , (function(last){
                                       return function(res){
                                         if(res.ok){
                                           log.info(res
                                                    , "wrote data to exchange");
                                         }
                                         if(res.error){
                                           log.error(res
                                                     , "attempt to write to exchange");
                                         }
                                         if(last && _.isFunction(cb)){
                                           ro = {ok:true};
                                           log.info(ro
                                                   , "wrote all data to exchange");

                                           cb(ro);
                                         }
                                       }}(i == Nks -1)));
    } // for
  } // fromdata

  if(fromtask){
    mp.exchange.get( path, function(exval){
      ok = true;
      path = task.ExchangePath.split(".");


      if(exval){
        value = _.extend(exval, data);
      }else{
        value = data;
    }

      mp.exchange.set( path , value, function(res){
        if(res.ok){
          log.info(res
                  ,"wrote data to exchange");
        }
        if(res.error){
        log.error(res
                 ,"attempt to write to exchange");
        }
        if(_.isFunction(cb)){
          cb(res);
        }
      });
    }); // get exval
  } // fromtask

  if(!ok){
    ro = {error:"data exchange"};
    log.error({error:"data exchange"}
             , "find path/data neither in data nor in task");
    if(_.isFunction(cb)){
      cb(ro);
    }
  }
};
exports.write_to_exchange = write_to_exchange;
