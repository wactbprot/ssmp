var _        = require("underscore"),
    bunyan   = require("bunyan"),
    net      = require("./net"),
    deflt    = require("./default"),
    utils    = require("./utils"),
    log      = bunyan.createLogger({name: deflt.appname});


module.exports = function(mp, task, path, jd, cb){
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
      utils.query_cd(mp, task, data)
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
