/**
 * generische Funktionen
 * zum Organisieren der codes
 * wie
 * - mod erzeugt closure modules
 * - lift
 * - walk
 * - check
 */
var _        = require("underscore"),
    bunyan   = require("bunyan"),
    obpa     = require("object-path"),
    deflt    = require("./default"),
    log      = bunyan.createLogger({name: deflt.appname}),
    ctrlstr  = deflt.ctrlStr;

/**
 * ```mod``` ist closure die das object
 * ```def``` closed.
 * Auf dem Objekt werden  ```getter```
 * und ```setter``` zur Verfügung gestellt,
 * die benutzt werden können um sichere
 * Objekte wie```params```, ```ids```,
 * ```mps``` uvm. zu erzeugen. Das
 * Zugriffsmuster ist dann z.B.
 *
 * ```var mpSystemHeartbeat = mp.param.get(["system", "heartbeat"])```
 *
 * oder
 *
 * ```mp.param.set(["system", "heartbeat"], 1000)```
 *
 * oder
 *
 * ```mp.ctrl.ini([], "foo")```
 */

var mod = function(obj){
  var def  = obj || {};
  return {
    ensure:function(p, o){
      obpa.ensureExists(def, p, o);
    },
    get:function(p){
      var res;
      if(_.isArray(p) && _.isEmpty(p)){
        res = def;
      }else{
        res =  obpa.get(def, p);
      }
      return res;
    },
    set:function(p, obj, cb){
      obpa.set(def, p, obj);
      if(_.isFunction(cb)){
        if(_.isEqual(obpa.get(def, p), obj)){
          cb({ok:true})
        }else{
          cb({error:"set fails"})
        }
      }
    },
    del:function(p, cb){
      obpa.del(def, p);
      if(_.isFunction(cb)){
        cb({ok:true})
      }
    }
  }
};
exports.mod = mod;

/**
 * Läuft in sequenzieller Weise
 * über die ```state``` Struktur
 * und führt sukzessive die Funktion
 * ```exec``` mit ```mp``` und ```path```
 * als parameter aus
 */
var walkstate = function(mp, no, exec){

  if(_.isFunction(exec)){

    var state = mp.state.get([no]),
        seqN  = state.length;

    for(var seq = 0; seq < seqN; seq++){
      var seqElem = state[seq],
          parN    = seqElem.length;

      if(_.contains(seqElem, ctrlstr.work)){
        break;
      }
      if(_.contains(seqElem, ctrlstr.ready)){
        for(var par = 0; par < parN; par++){
          exec(mp, [no, seq, par]);
        }
        break;
      }
    }
 }else{
    log.error({error:"not a function"}, "function walk receives: " + exec)
  }
};
exports.walkstate = walkstate;

/**
 * Kontrolliert den Zustand des Containers
 * Nummer ```no``` und fasst diesen in einem
 * String zusammen
 */
var checkstate = function(mp, no){
  var gs     = ctrlstr.ini, // global state
      cs     = ctrlstr.ini, // current state
      ret    = ctrlstr.ini, // return state
      state  = mp.state.get([no]),
      seqN   = state.length;

  for(var seq = 0; seq < seqN; seq++){
    var seqElem = state[seq],
        parN    = seqElem.length;
    for(var par = 0; par < parN; par++){
      cs = mp.state.get([no, seq, par]);
      if(gs === ctrlstr.ini){
        gs = cs;
      }
      if(cs !== gs){
        ret = ctrlstr.work;
        break;
      }
    }
    if(ret !== ctrlstr.ini){
      break;
    }
  }
  if(ret === ctrlstr.ini){
    ret = gs;
  }
  return ret;
};
exports.checkstate = checkstate;

var setstate = function(mp, no, struct, val,  cb){
  var seqN = struct.length
  for(var seq = 0; seq < seqN; seq++){
    var seqElem = struct[seq],
        parN    = seqElem.length;
    for(var par = 0; par < parN; par++){
      mp.state.set([no, seq, par], val, function(){
        if(seq === seqN -1 && par === parN -1){
          cb()
        }
      });
    }
  }
};
exports.setstate = setstate;

var pad0 = function(n){
    return n < 10 ? "0" + n : n;
};
exports.pad0 = pad0;

var vlDateString = function(dstr){
    var dt = dstr ? new Date(dstr) : new Date(),
    Y = dt.getFullYear(),
    M = pad0(dt.getMonth()+1),
    D = pad0(dt.getDate()),
    h = pad0(dt.getHours()),
    m = pad0(dt.getMinutes());
    return Y + '-' + M + '-' + D + " " + h+":" + m;
};
exports.vlDateString = vlDateString;

var vlTimeString = function(){
    var dt = new Date();

    return "" + dt.getTime();
};
exports.vlTimeString = vlTimeString;
