var _        = require("underscore"),
    bunyan   = require("bunyan"),
    jpp      = require("json-path-processor");

module.exports = function(doc, path, dataset, cb){
  var jdoc;
  for(var i = 0; i < dataset.length; i++){
    jdoc = jpp(doc);
    var data = dataset[i],
        dv   = jdoc.value(path),
        pos  = -1,
        ppos = 0;
    // write Type, Value, Unit- Structures
    if(data.Type  &&
       data.Value &&
       data.Unit ){
      if(_.isUndefined(dv)){
        jdoc.set(path,[],true)
      }
      if(_.isArray(dv)){
        for(var k = 0; k < dv.length; k++){
          if(data.Type === jdoc.value([path,k,"Type"].join("."))){
            pos = k;
          }
        }
        if(pos < 0){
          pos = k;
        }
      }else{
        pos = 0;
      }
      // :: Type ::
      jdoc.set([path, pos, "Type"].join("."), data.Type, true);
      // :: Unit ::
      jdoc.set([path, pos, "Unit"].join("."), data.Unit, true);
      // :: Value ::
      var dvv = jdoc.value([path, pos, "Value"].join("."))
      if(_.isArray(dvv)){
        ppos = dvv.length;
      }else{
        jdoc.set([path, pos, "Value"].join("."), [], true)
      }
      jdoc.set([path, pos, "Value", ppos].join("."), data.Value, true);

      // :: Comment ::
      if(data.Comment){
        var dvc = jdoc.value([path, pos, "Comment"].join("."))
        if(!_.isArray(dvc)){
          jdoc.set([path, pos, "Comment"].join("."), [], true)
        }
        // ppos wird von value genommen
        jdoc.set([path, pos, "Comment", ppos].join("."), data.Comment, true);
      }

    }else{
      for(var j in data){
        // write stuff like Gas, Opk ...
        jdoc.set(path + "." + j, data[j], true);
      }
    }
  }
  if(jdoc && _.isFunction(cb)){
    cb(jdoc.value());
  }
};