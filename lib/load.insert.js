/**
 * @module load.insert
 */
var _        = require("underscore")
  , bunyan   = require("bunyan")
  , clone    = require("clone")
  , conf     = require("./conf")
  , logStrm  = require("bunyan-couchdb-stream")
  , utils    = require("./utils")
  , ok       = {ok:true}, err
  , log      = bunyan.createLogger({name: conf.app.name + ".load.insert",
                                    streams: conf.log.streams
                                   })

  , expand_task = require("./load.expandTask")
  , expand_cust = require("./load.expandCust");

/**
 * Fügt über Customer erweiterte Definitionen
 * in Gesamtablauf. Bsp.: Auslese der Kundengeräte.
 * @method insert
 * @param {Array} def noch nicht expandiertes Definitionsobjekt
 * @param {Object} calibobjs geladene Kalibrierungen
 * @param {Function} cb callback
 */
module.exports = function (def, calibobjs, cb){
  if(def && _.isArray(def)
         && (def.length > 0)
         && _.isArray(def[0])
         && (def[0].length > 0)
         && _.isObject(def[0][0])){

    var S      = def.length
      , ndef   = clone(def)
      , offset = 0
      , s
      , p;

    for(s = 0; s < S; s++){
      var  P = def[s].length;
      for(p = 0; p < P; p++){
        var defStep = def[s][p];
        var seqArr;

        if(defStep.Customer){
          seqArr = expand_cust(clone(defStep), calibobjs)
        }else{
          seqArr = expand_task(clone(defStep), calibobjs)
        }
        if(seqArr){
          var NseqArr = seqArr.length
            , intArr
            , preArr
            , pstArr
            , oldArr;

          if(p == 0){
            pstArr = ndef.slice(s + offset + 1, ndef.length);
            preArr = ndef.slice(0, s + offset);
            intArr = seqArr;
          }else{
            pstArr = ndef.slice(s + offset + NseqArr, ndef.length);
            oldArr = ndef.slice(s + offset, s + offset + NseqArr);
            preArr = ndef.slice(0, s + offset);
            // merge of oldArr and seqArr into intArr
            intArr = [[]];
            for(var intDef = 0; intDef < NseqArr; intDef++){
              if(_.isArray( intArr[intDef])){
                for(var oldPar = 0; oldPar < oldArr[intDef].length ; oldPar++){
                  intArr[intDef].push(oldArr[intDef][oldPar]);
                }
                for(var seqPar = 0; seqPar < seqArr[intDef].length ; seqPar++){
                  intArr[intDef].push(seqArr[intDef][seqPar]);
                }
              }else{
                err = new Error("not a array");
                log.error(err
                         , "an expandet def seems to contain a further task")
              }
            }
          }
          if( p == P - 1){
            offset = offset + NseqArr - 1;
          }
          ndef = preArr.concat(intArr).concat(pstArr);
        } // Expand seq
      } // for p
    } // for s
    if(_.isFunction(cb)){
      cb(null, ndef)
    }
  }else{
    err = new Error("wrong definition structure");
    log.error(err
             ,"the definition is not of the form [[{}, ..],..]");
    cb(err)
  }
}
