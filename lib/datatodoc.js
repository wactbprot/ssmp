var _        = require("underscore"),
    bunyan   = require("bunyan"),
    obpa       = require("object-path");

module.exports = function(doc, path, dataset, cb){

  for(var i = 0; i < dataset.length; i++){

    var data = dataset[i],
        dv   = obpa.get(doc,path),
        pos  = -1,
        ppos = 0;
    // write Type, Value, Unit- Structures
    if(data.Type  &&
       data.Value &&
       data.Unit ){

      if(_.isUndefined(dv)){
        obpa.set(doc, path, [])
      }

      if(_.isArray(dv)){
        for(var k = 0; k < dv.length; k++){
          if(data.Type === obpa.get(doc,[path,k,"Type"].join("."))){
            pos = k;
          }
        }
        if(pos < 0){
          pos = k;
        }
      }else{
        pos = 0;
      }
      obpa.ensureExists(doc,[path, pos].join("."), {})
      // :: Type ::
      obpa.set(doc,[path, pos, "Type"].join("."), data.Type);
      // :: Unit ::
      obpa.set(doc,[path, pos, "Unit"].join("."), data.Unit);
      // :: Value ::
      var dvv = obpa.get(doc,[path, pos, "Value"].join("."))
      if(_.isArray(dvv)){
        ppos = dvv.length;
      }else{
        obpa.set(doc, [path, pos, "Value"].join("."), [])
      }
      obpa.set(doc, [path, pos, "Value", ppos].join("."), data.Value);

      // :: Comment ::
      if(data.Comment){
        var dvc = obpa.get(doc, [path, pos, "Comment"].join("."))
        if(!_.isArray(dvc)){
          obpa.set(doc,[path, pos, "Comment"].join("."), [])
        }
        // ppos wird von value genommen
        obpa.set(doc, [path, pos, "Comment", ppos].join("."), data.Comment);
      }

    }else{
      for(var j in data){
        // write stuff like Gas, okpk ...
        obpa.set(doc, [path, j].join("."), data[j]);
      }
    }
  }
  if(_.isFunction(cb)){
    cb(doc);
  }
};