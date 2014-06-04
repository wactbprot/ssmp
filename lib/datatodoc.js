var _        = require("underscore"),
    bunyan   = require("bunyan"),
    gen      = require("./generics"),
    obpa     = require("object-path");

module.exports = function(doc, path, dataset, cb){

  var dmod = gen.mod(doc);

  for(var i = 0; i < dataset.length; i++){

    var data = dataset[i],
        dv   = dmod.get(path),
        pos  = -1,
        ppos = 0;

    // write Type, Value, Unit- Structures
    if(data.Type  &&
       data.Value &&
       data.Unit ){

      if(_.isUndefined(dv)){
        dmod.set(path, [])
      }

      if(_.isArray(dv)){
        for(var k = 0; k < dv.length; k++){
          if(data.Type === dmod.get([path, k, "Type"].join("."))){
            pos = k;
          }
        }
        if(pos < 0){
          pos = k;
        }
      }else{
        pos = 0;
      }
      dmod.ensure([path, pos].join("."), {})
      // --*-- Type --*--
      dmod.set([path, pos, "Type"].join("."), data.Type);
      // --*-- Unit --*--
      dmod.set([path, pos, "Unit"].join("."), data.Unit);
      // --*-- Value --*--
      var dvv = dmod.get([path, pos, "Value"].join("."))
      if(_.isArray(dvv)){
        ppos = dvv.length;
      }else{
        dmod.set([path, pos, "Value"].join("."), [])
      }
      dmod.set([path, pos, "Value", ppos].join("."), data.Value);

      // --*-- Comment --*--
      if(data.Comment){
        var dvc = dmod.get([path, pos, "Comment"].join("."))
        if(!_.isArray(dvc)){
          dmod.set([path, pos, "Comment"].join("."), [])
        }
        // ppos wird von value genommen
        dmod.set([path, pos, "Comment", ppos].join("."), data.Comment);
      }

    }else{
      for(var j in data){
        // write stuff like Gas, okpk ...
        dmod.set([path, j].join("."), data[j]);
      }
    }
  }
  if(_.isFunction(cb)){
    cb(dmod.get([]));
  }
};