var _        = require("underscore"),
    bunyan   = require("bunyan"),
    net      = require("./net"),
    col      = require("./collections"),
    deflt    = require("./default"),
    gen      = require("./generic"),
    log      = bunyan.createLogger({name: deflt.appname}),
    ctrlstr  = deflt.ctrlStr;

/**
 * wenn der cmdstr kann so aussieht:
 * "load;run;stop"
 * soll das rauskommen:
 * ["load","run", "stop"]
 * wenn der cmdstr kann so aussieht:
 * "load;2:run,stop"
 * soll das rauskommen:
 * ["load","run", "stop","run", "stop"]
 */

var cmd_to_array = function(cmdstr){
  var arr = [],
      al1 = cmdstr.split(";");
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
};
exports.cmd_to_array = cmd_to_array;

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
  var path = [],
      struct = req.params.struct,
      l1   = req.params.l1,
      l2   = req.params.l2,
      l3   = req.params.l3,
      msg  = "request to " + struct + "/";

  if(l3 && l2 && l1){
    log.info({ok: true}, msg + l1 + "/" + l2 + "/"+ l3 );
    path = [l1, l2, l3];
  }

  if(l2 && l1 && !l3){
    log.info({ok: true}, msg + l1 + "/" + l2 );
    path = [l1, l2];
  }

  if(l1 && !l2 && !l3){
    log.info({ok: true}, msg + l1 );
    path = [l1];
  }
  if(!l1 && !l2 && !l3){
    log.info({ok: true}, msg  );
  }
  return path;
}
exports.get_path = get_path;

var get = function(mps, req){
  var msg, ro, obj, path,
      id     = req.params.id,
      struct = req.params.struct;

  if(id        &&
     mps[id]){
    if(struct  &&
       mps[id][struct] &&
       _.isFunction(mps[id][struct].get)){

      obj  = mps[id][struct].get(get_path(req));
      if(_.isUndefined(obj)){
        ro = {error:"object is undefined"}
        log.error(ro,"found nothing in the path");
      }else{
        if(_.isObject(obj) || _.isArray(obj)){
          ro = obj;
          log.info({ok:true}, "sent object back");
        }else{
          ro  = {result:obj}
          log.info({ok:true}, "sent value back");
        };

      }
    }else{
      ro = {error: "undefined structure"};
      log.error(ro,"no such structure");
    }
  }else{
    ro = {error: "mpdef not found"}
    log.error(ro, "maybe not initialized");
  }
  return ro;
}
exports.get = get;

var del = function(mps, req, cb){
  var msg, ro, path,
      id     = req.params.id,
      struct = req.params.struct;

  if(id            &&
     struct        &&
     mps[id]       &&
     mps[id][struct]){

    path = get_path(req);

    if(_.isEmpty(path)){
      msg = "empty path";
      ro  = {error: msg};
      log.error(req, msg);

      cb(ro);

    }else{
      log.info({ok: true}, "try to delete");
      mps[id][struct].del(get_path(req), cb);
    }
  }else{
    msg = "not a valid structure";
    ro = {error: msg};
    log.error(req, msg);
    cb(ro);
  }
};
exports.del = del;

var put = function(mps, req, cb){
  var msg, ro, path, value,
      ok     = true,
      id     = req.params.id,
      struct = req.params.struct,
      obj    = req.body;

  if(_.isUndefined(obj) ||
     _.isFunction(obj)){

    ro  = {error: "object not valid"};
    log.error(req, "object must not be a function or undefined");

    cb(ro);

  }else{
    if(id            &&
       struct        &&
       mps[id]       &&
       mps[id][struct]){

      path = get_path(req);

      if(_.isEmpty(path)){
        msg = "empty path";
        ro  = {error: msg};
        log.error(req, msg);

        cb(ro);

      }else{
        log.info({ok: true}, "try to set");
        mps[id][struct].set(get_path(req), obj, cb);
      }
    }else{
      msg = "not a valid structure";
      ro  = {error: msg};
      log.error(req, msg);

      cb(ro);

    }
  }
};
exports.put = put;


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
var data_to_doc = function(doc, path, dataset, cb){
  var dmod = gen.mod(doc);
  for(var i = 0; i < dataset.length; i++){

    var data = dataset[i],
        dv   = dmod.get(path),
        pos  = -1,
        ppos = 0;

    // write Type, Value, Unit- Structures
    if(data.Type  &&
       data.Value &&
       data.Unit ){

      if(_.isUndefined(dv)){
        dmod.set(path, [])
      }

      if(_.isArray(dv)){
        for(var k = 0; k < dv.length; k++){
          if(data.Type === dmod.get([path, k, "Type"].join("."))){
            pos = k;
          }
        }
        if(pos < 0){
          pos = k;
        }
      }else{
        pos = 0;
      }

      dmod.ensure([path, pos].join("."), {})
      // --*-- Type --*--
      dmod.set([path, pos, "Type"].join("."), data.Type);
      // --*-- Unit --*--
      dmod.set([path, pos, "Unit"].join("."), data.Unit);
      // --*-- Value --*--
      var dvv = dmod.get([path, pos, "Value"].join("."))
      if(_.isArray(dvv)){
        ppos = dvv.length;
      }else{
        dmod.set([path, pos, "Value"].join("."), [])
      }
      dmod.set([path, pos, "Value", ppos].join("."), data.Value);

      // --*-- Comment --*--
      if(data.Comment){
        var dvc = dmod.get([path, pos, "Comment"].join("."))
        if(!_.isArray(dvc)){
          dmod.set([path, pos, "Comment"].join("."), [])
        }
        // ppos wird von value genommen
        dmod.set([path, pos, "Comment", ppos].join("."), data.Comment);
      }

    }else{
      for(var j in data){
        // write stuff like Gas, okpk ...
        dmod.set([path, j].join("."), data[j]);
      }
    }
  }
  if(_.isFunction(cb)){
    cb(dmod.get([]));
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
 * @param {Object} data Objekt mit Result key
 * @param {Function} cb Callback Funktion
 */
var query_cd = function(mp, task, data, cb){

  if(task.Id         &&
     task.Id.length  > 0){

    if(data.Result            &&
       _.isArray(data.Result) &&
       data.Result.length > 0 &&
       task.DocPath){

      var dbcon   = net.doc(mp),
          Id      = task.Id,
          path    = task.DocPath,
          dataset = data.Result,
          Nid     = Id.length;

      for(var i = 0; i < Nid; i++){

        var id = Id[i];

      dbcon.get(id, (function(j){
                      return function(error, doc){
                        if(error){
                          log.error({error:error}
                                   ,"failed to load doc for saving datasets");
                        }
                        if(doc){
                          log.info({ok:true}
                                  ,"try writing data to doc");

                          data_to_doc(doc, path, dataset, function(doc){

                            log.info({ok:true}
                                    ,"try writing doc to data base");
                            dbcon.insert(doc, function(error, ok){
                              if(error){
                                log.error({error: error}
                                         ,"failed to save doc while saving datasets");
                                if(j === Nid -1 && _.isFunction(cb)){
                                  cb("error");
                                }
                              }
                              if(ok){
                                log.info(ok, "doc written to data base");
                                if(j === Nid -1 && _.isFunction(cb)){
                                  cb("ok");
                                }
                              }
                            });
                          });
                        }; // if doc
                      } }(i))
               );// db.get
      } // for Ids
    }// Result & DocPath
  }else{
    log.warn({warn:"no or empty Id array"},
             "seems to be a test; no calibration doc selected");
    if(_.isFunction(cb)){
      cb("ok");
    }
  }
};
exports.query_cd = query_cd;