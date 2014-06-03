var _        = require("underscore"),
    bunyan   = require("bunyan"),
    op       = require("object-path");

module.exports = function(doc, path, dataset, cb){

  for(var i = 0; i < dataset.length; i++){

    var data = dataset[i],
        dv   = op.get(doc,path),
        pos  = -1,
        ppos = 0;
    // write Type, Value, Unit- Structures
    if(data.Type  &&
       data.Value &&
       data.Unit ){

      if(_.isUndefined(dv)){
        op.set(doc, path, [])
      }

      if(_.isArray(dv)){
        for(var k = 0; k < dv.length; k++){
          if(data.Type === op.get(doc,[path,k,"Type"].join("."))){
            pos = k;
          }
        }
        if(pos < 0){
          pos = k;
        }
      }else{
        pos = 0;
      }
      op.ensureExists(doc,[path, pos].join("."), {})
      // :: Type ::
      op.set(doc,[path, pos, "Type"].join("."), data.Type);
      // :: Unit ::
      op.set(doc,[path, pos, "Unit"].join("."), data.Unit);
      // :: Value ::
      var dvv = op.get(doc,[path, pos, "Value"].join("."))
      if(_.isArray(dvv)){
        ppos = dvv.length;
      }else{
        op.set(doc, [path, pos, "Value"].join("."), [])
      }
      op.set(doc, [path, pos, "Value", ppos].join("."), data.Value);

      // :: Comment ::
      if(data.Comment){
        var dvc = op.get(doc, [path, pos, "Comment"].join("."))
        if(!_.isArray(dvc)){
          op.set(doc,[path, pos, "Comment"].join("."), [])
        }
        // ppos wird von value genommen
        op.set(doc, [path, pos, "Comment", ppos].join("."), data.Comment);
      }

    }else{
      for(var j in data){
        // write stuff like Gas, Opk ...
        op.set(doc, [path, j].join("."), data[j]);
      }
    }
  }
  if(_.isFunction(cb)){
    cb(doc);
  }
};