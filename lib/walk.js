var _        = require("underscore"),
    bunyan   = require("bunyan"),
    deflt    = require("./default"),
    log      = bunyan.createLogger({name: deflt.appname}),
    ctrlstr  = deflt.ctrlStr;


var ndata = require('ndata');
var mem   = ndata.createClient({port: 9000})

/**
 * Die Funktion kopiert die Struktur ```template```
 * und erzeugt eine genauso strukturiertes
 * Objekt unter ```path``` und initialisiert
 * es mit ```val```
 *
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