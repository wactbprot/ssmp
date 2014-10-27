var _        = require("underscore"),
    bunyan   = require("bunyan"),
    obpa     = require("object-path"),
    clone    = require("clone"),
    deflt    = require("./default"),
    log      = bunyan.createLogger({name: deflt.appname}),
    ctrlstr  = deflt.ctrlStr;

/**
 * ```mod``` ist closure die das Objekt
 * ```def``` closed.
 * Auf dem Objekt werden  ```getter```
 * und ```setter``` zur Verfügung gestellt,
 * die benutzt werden können um sichere
 * Objekte wie```params```, ```ids```,
 * ```mps``` uvm. zu erzeugen. Das
 * Zugriffsmuster ist dann z.B.
 *
 * ```
 * var mpSystemHeartbeat = mp.param.get(["system", "heartbeat"])
 * ```
 *
 * oder
 *
 * ```
 * mp.param.set(["system", "heartbeat"], 1000)
 * ```
 *
 * oder
 *
 * ```
 * mp.ctrl.ini([], "foo")
 * ```
 * @param {Object} obj Inertialobjekt
 */

var mod = function(obj){
  var def  = obj || {};
  return {
    ensure:function(p, o){
      obpa.ensureExists(def, p, o);
    },
    get:function(p, cb){
      var res;
      if(_.isArray(p) && _.isEmpty(p)){
        res = def;
      }else{
        res =  obpa.get(def, p);
      }

      if(_.isFunction(cb)){
        // clone very important in order to keep the origin definition
        cb(clone(res));
      }
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
 * als Parameter aus
 *
 * @param {Object} mp Messprog.-Objekt
 * @param {Number} no Container
 * @param {Array} struct Struktur über die iteriert werden soll
 * @param {Function} exec Aufruf
 */
var walkstruct = function(mp, no, struct, exec){

  if(_.isFunction(exec)){

      var  seqN  = struct.length;

      for(var seq = 0; seq < seqN; seq++){
        var seqElem = struct[seq],
            parN    = seqElem.length;
        if(_.contains(seqElem, ctrlstr.ready)){
          for(var par = 0; par < parN; par++){
            if(seqElem[par] === ctrlstr.ready){
              exec(mp, [no, seq, par]);
            }
          }
          break;
        }
        if(_.contains(seqElem, ctrlstr.work)){
          break;
        }
        if(_.contains(seqElem, ctrlstr.error)){
          break;
        }
      }
  }else{
    log.error({error:"not a function"}
             , "function walk receives: "
             + exec)
  }
};
exports.walkstruct = walkstruct;

/**
 * Kontrolliert den Zustand des Containers
 * Nummer ```no``` und fasst diesen in einem
 * String zusammen.
 *
 * @param {Object} mp Messprog.-Objekt
 * @param {Number} no Container
 */
var checkstate = function(mp, no, cb){
  var gs     = ctrlstr.ini, // global state
      cs     = ctrlstr.ini, // current state
      ret    = ctrlstr.ini; // return state

  mp.state.get([no], function(state){
    var seqN   = state.length;

    for(var seq = 0; seq < seqN; seq++){
    var seqElem = state[seq],
        parN    = seqElem.length;
      for(var par = 0; par < parN; par++){
        cs = state[seq][par];
        if(gs === ctrlstr.ini){
          gs = cs;
        }
        if(cs !== gs){
          ret = ctrlstr.work;
          break;
        }
      } // for par
      if(ret !== ctrlstr.ini){
        break;
      }
    } // for seq
    if(ret === ctrlstr.ini){
      ret = gs;
    }
    if(_.isFunction(cb)){
      cb(ret);
    }
  })
};
exports.checkstate = checkstate;

/**
 * Die Funktion kopiert die Struktur ```struct```
 * Sie erzeugt eine genauso strukturiertes
 * ```mp.state.[g|s]et```-Objekt und initialisiert
 * es mit ```val```
 *
 * @param {Object} mp Messprog.-Objekt
 * @param {Number} no Container
 * @param {Array} struct Strukturvorlage
 * @param {String} val Inertialer Wert
 * @param {Function} cb callback Funktion
 */
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
