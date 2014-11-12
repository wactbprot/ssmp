var _        = require("underscore"),
    bunyan   = require("bunyan"),
    deflt    = require("./default"),
    log      = bunyan.createLogger({name: deflt.appname}),
    ctrlstr  = deflt.ctrlStr;


var ndata = require('ndata');
var mem   = ndata.createClient({port: 9000})

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
var struct = function(mp, no, struct, exec){
  if(_.isFunction(exec)){
    var seqN = struct.length;
    for(var seq = 0; seq < seqN; seq++){
      var seqElem = struct[seq],
          parN = seqElem.length;
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
exports.struct = struct;
/**
 * Kontrolliert den Zustand des Containers
 * Nummer ```no``` und fasst diesen in einem
 * String zusammen.
 *
 * @param {Object} mp Messprog.-Objekt
 * @param {Number} no Container
 */
var checkstate = function(mp, no, cb){
  var gs = ctrlstr.ini, // global state
  cs = ctrlstr.ini, // current state
  ret = ctrlstr.ini; // return state
  mp.state.get([no], function(state){
    var seqN = state.length;
    for(var seq = 0; seq < seqN; seq++){
      var seqElem = state[seq],
          parN = seqElem.length;
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
 * Die Funktion kopiert die Struktur ```template```
 * und erzeugt eine genauso strukturiertes
 * Objekt unter ```path``` und initialisiert
 * es mit ```val```
 *
 * @param {Object} mp Messprog.-Objekt
 * @param {Number} no Container
 * @param {Array} template Strukturvorlage
 * @param {String} val Inertialer Wert
 * @param {Function} cb callback Funktion
 */
var cp = function(path, template, val, cb){
  var seqN = template.length
  for(var seq = 0; seq < seqN; seq++){
    var seqElem = template[seq],
        parN = seqElem.length;
    for(var par = 0; par < parN; par++){
      var lpath = path.concat([ seq, par]);
      mem.set(lpath, val, function(last){
                            return function(err){
                              if(last){
                                cb()
                              }
                            }}(seq === seqN -1 && par === parN -1));
    }
  }
};
exports.cp = cp;