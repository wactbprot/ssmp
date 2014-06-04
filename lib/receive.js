var _        = require("underscore"),
    bunyan   = require("bunyan"),
    net      = require("./net"),
    d        = require("./defaults"),
    write    = require("./datatodoc"),
    log      = bunyan.createLogger({name: d.appname});


module.exports = function(mp, task, jd){
  var data = JSON.parse(jd)

  if(_.isObject(data)){
    if(task.DocPath){
      save(mp, task, data)
    }
  }else{
    log.error({error:"parse data"}, "can not parse returned data")
  }
};

var save = function(mp, task, data){

  if(data.Result            &&
     _.isArray(data.Result) &&
     data.Result.length > 0 &&
     task.Id                &&
     task.Id.length     > 0 &&
     task.DocPath){

    var dbcon   = net.doc(mp),
        Id      = task.Id,
        path    = task.DocPath,
        dataset = data.Result;

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
      });// db.get
    } // for Ids
  }// Result & Id & DocPath
};
