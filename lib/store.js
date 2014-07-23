var _        = require("underscore"),
    bunyan   = require("bunyan"),
    net      = require("./net"),
    deflt    = require("./default"),
    write    = require("./datatodoc"),
    log      = bunyan.createLogger({name: deflt.appname});


var receive = function(mp, task, path, jd, cb){
  // nano liefert objecte anderes nicht
  var data;

  if(_.isString(jd)){
    data = JSON.parse(jd)
  }else{
    data = jd;
  }
  if(_.isObject(data)){

    // --- write data to calibration doc
    if(task.DocPath){
      calldoc(mp, task, data)
    }

    // --- write data to exchange interface
    if(data.ToExchange){
      var exdata = data.ToExchange;
      if(_.isObject(exdata)){
        for(var exchpath in exdata){
          mp.exchange.set( exchpath.split("."), exdata[exchpath], function(){
            log.info({ok:true}, "writing data to exchange");
          });
        }
      }else{
        log.error({error:"data exchange"}, "expect data.ToExchange to be an Object")
      }
    }

    // --- write data to log db
    if(data.RawData  && task.LogPriority){
      // ToDo
    }
    if(task.ExchangePath){
      mp.exchange.set( task.ExchangePath.split("."), data, function(){
        if(_.isFunction(cb)){
          cb("ok");
        }
      })
    }
  }else{
    log.error({error:"parse data"}, "can not parse returned data")
  }
};
exports.receive = receive;

var calldoc = function(mp, task, data, cb){

  if(data.Result            &&
     _.isArray(data.Result) &&
     data.Result.length > 0 &&
     task.Id                &&
     task.Id.length     > 0 &&
     task.DocPath){
console.log("llllllllllllllllllllllllllllL")
    var dbcon   = net.doc(mp),
        Id      = task.Id,
        path    = task.DocPath,
        dataset = data.Result,
        Nid     = Id.length;

    for(var i = 0; i < Nid; i++){
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
                if(i === Nid -1 && _.isFunction(cb)){
                  cb("ok");
                }
              }
              if(ok){
                log.info(ok, "doc written to data base");
                if(i === Nid -1 && _.isFunction(cb)){
                  cb("ok");
                }
              }
            });
          });
        }
      });// db.get
    } // for Ids
  }// Result & Id & DocPath
};
exports.calldoc = calldoc;