var _        = require("underscore"),
    bunyan   = require("bunyan"),
    mpath    = require("mpath"),
    net      = require("./net"),
    d        = require("./defaults"),
    log      = bunyan.createLogger({name: d.appname});


var receive = function(mp, task, jd){
  var data = JSON.parse(jd)

  if(_.isObject(data)){
    if(task.DocPath){
      save(mp, task, data)
    }
  }else{
    log.error({error:"parse data"}, "can not parse returned data")
  }
};
module.exports = receive;

var save = function(mp, t, d){

  if(d.Result            &&
     _.isArray(d.Result) &&
     d.Result.length > 0 &&
     t.Id                &&
     t.Id.length     > 0 &&
     t.DocPath){

    var dbcon   = net.doc(mp),
        Id      = t.Id,
        path    = t.DocPath,
        dataset = d.Result;

    for(var i = 0; i < Id.length; i++){
      var id = Id[i];
      dbcon.get(id, function(error, doc){
        if(error){
          log.error({error:error}, "failed to load doc for saving data");
        }
        if(doc){
          log.info({ok:true}, "try writing data to doc");
          write(doc, path, dataset, function(doc){
            log.info({ok:true}, "try writing doc to data base");
            dbcon.insert(doc,function(error, ok){
              if(error){
                log.error({error: error}, "failed to save doc while saving data");
              }
              if(ok){
                log.info(ok, "doc written to data base");
              }
            });

          });
        }
      });// get
    } // for
  }// Result & Id & DocPath
};

var write = function(doc, path, dataset, cb){
  for(var i = 0; i < dataset.length; i++){
    var data = dataset[i],
        dv   = mpath.get(doc, path),
        pos;
    console.log(dv)

    // write Type, Value, Unit- Structures
    if(data.Type  &&
       data.Value){

      if(_.isArray(dv)){
        console.log("array")
        for(var k = 0; k < dv.length; k++){
          var ctp = path +"."+ k + "." + "Type";
          if(data.Type === mpath.get(doc, ctp)){
            pos = k;
          }
        }
        if(!pos){
          pos = k + 1;
        }
      }else{
        console.log("---0---")

        pos = 0;
      }

      var bpath = [path, pos].join(".");
      mpath.set(doc,  bpath +"." + "Type", data.Type);

    }else{
      for(var j in data){
        // write stuff like Gas, Opk ...
        mpath.set(doc, path + "." + j, data[j]);
      }
    }
  }
  if(_.isFunction(cb)){
    //cb(doc);
  }
}
