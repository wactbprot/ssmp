var _        = require("underscore")
  , bunyan   = require("bunyan")
  , logStrm  = require("bunyan-couchdb-stream")
  , op       = require("object-path")
  , conf     = require("./conf")
  , utils    = require("./utils")
  , ok       = {ok:true}, err
  , log      = bunyan.createLogger({name: conf.app.name + ".utils.dataToDoc",
                                    streams: utils.log_streams
                                   });

/**
 * Die Function ```data_to_doc```
 * schreibt Daten in Dokumente und ruft den callback
 * (in aller Regel ```save(doc)```)
 * mit dem so aufgefüllten Dokument auf.
 *
 * @method data_to_doc
 * @param {Object} doc Dokument (Kalibrierdokument)
 * @param {Array} path
 * @param {Object} data Datenobjekten
 * @param {Function} cb Callback Funktion
 */
module.exports = function (doc, path, data, cb){
  var data_result = data.Result
  if(data_result && _.isArray(data_result) && data_result.length > 0 ){
    var Nds     = data_result.length;
    log.trace(ok
            , "found "+ Nds + " data set(s) "
            + "to store below path " + path );

    for(var i = 0; i < Nds; i++){
      var doc_struct   = op.get(doc, path)
        , data_struct  = data_result[i]
        , pos          = -1
        , ppos         = 0;
      if(_.isString(data_struct.Type)){ // write Type, Value Structures (Unit is not necessary e.g. at Date)

        if((_.isNull(data_struct.Value) || _.isNumber(data_struct.Value) || _.isString(data_struct.Value))){

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

          // ----- Value
          var doc_struct_value = op.get(doc, [path, pos, "Value"].join("."));
          if(_.isArray(doc_struct_value)){
            ppos = doc_struct_value.length;
          }else{
            op.set(doc, [path, pos, "Value"].join("."), []);
            ppos = 0;
          }
          op.set(doc, [path, pos, "Value", ppos].join("."), data_struct.Value);

          // ----- Unit
          if(data_struct.Unit){
            op.set(doc, [path, pos, "Unit"].join("."), data_struct.Unit);
          }

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
        log.trace(ok
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
