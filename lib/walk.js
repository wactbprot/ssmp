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