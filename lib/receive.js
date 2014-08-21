var _        = require("underscore"),
    bunyan   = require("bunyan"),
    net      = require("./net"),
    deflt    = require("./default"),
    utils    = require("./utils"),
    log      = bunyan.createLogger({name: deflt.appname});

/**
 * Die ```receive()``` Function ist die
 * Standard-Callbackfunktion für Netzwerkaufrufe
 * wie  ```noderelay()``` oder get List.
 *
 * Was konkret mit den Daten geschied wird:
 *
 *
 * 1.) anhand der Daten entschieden:
 * ```
 * if(data.ToExchange) ...
 * ```
 * Ein Bsp. hierfür wäre der  ```getList()``` worker
 *
 * oder
 *
 * 2.) anhand der Task entschieden:
 * ```
 * if(task.ExchangePath) ...
 * ```
 *
 * Dieser Abschnitt ist für Fälle in denen kein
 * PostProcessing zur Verfügung steht
 * aber trotzdem data nach ```Exchange```
 * geschrieben werden soll
 */

module.exports = function(mp, task, path, data, cb){
  // data muss schon object (kein json sein)
  var valid = false;

  if(_.isObject(data)){

    // --- write data to calibration doc
    if(task.DocPath){
      valid = true;
      log.info({ok:true}, "found DocPath, try to save");
      utils.query_cd(mp, task, data, cb)
    }

    // --- write data to exchange interfaceover ToExchange
    if(data.ToExchange){
      valid = true;
      var exdata = data.ToExchange;
      if(_.isObject(exdata)){
        // why _.first?
        // because ToExchange should only have
        // one key
        var kpath  = _.keys(exdata);
        if(kpath.length === 1){
          var epath  = _.first(kpath),
              evalue =  exdata[epath];

          mp.exchange.set( epath.split("."), evalue , function(){
            log.info({ok:true}, "wrote data to exchange because data.ToExchange");
            if(_.isFunction(cb)){
              cb("ok");
            }
          });
        }else{
          log.error({error:"data loss"}, "data.ToExchange contains more than 1 key");
        }
      }else{
        log.error({error:"data exchange"}, "expect data.ToExchange to be an Object");
      }
    }
    // --- write data to exchange interface over ExchangePath
    if(task.ExchangePath){
      valid = true;
      mp.exchange.set( task.ExchangePath.split("."), data, function(){
        log.info({ok:true}, "wrote data to exchange because task.ExchangePath");
        if(_.isFunction(cb)){
          cb("ok");
        }
      })
    }

    // --- write data to log db
    if(data.RawData  && task.LogPriority){
      valid = true;
      // ToDo
    }
    if(!valid){
      log.warn({warn:true}, "no eval branch for data found");
    }
  }else{
    log.error({error:"format"}, "data is not an object")
  }
};
