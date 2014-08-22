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
  var done = false;

  if(_.isObject(data)){


    // --*-- DocPath + ToExchange --*--
    if(!done && task.DocPath && data.ToExchange){
      done = true;
      log.info({ok:true},
               "found DocPath and ToExchange, try to save");
      utils.query_cd(mp, task, data, function(res){
        if(res == "ok"){
          utils.write_to_exchange(mp, task, data, cb);
        }else{
          cb("error");
        }
      })
    }

    // --*-- DocPath --*--
    if(!done && task.DocPath){
      done = true;
      log.info({ok:true},
               "found DocPath, try to save");
      utils.query_cd(mp, task, data, cb)
    }

    // --*-- ToExchange --*--
    if(!done && data.ToExchange){
      done = true;
      log.info({ok:true},
               "found DocPath, try to save");
      utils.write_to_exchange(mp, task, data, cb)
    }

    // --*-- ExchangePath --*--
    if(! done && task.ExchangePath){
      done = true;
      log.info({ok:true},
               "found DocPath, try to save");
      utils.write_to_exchange(mp, task, data, cb)

    }

    // --- write data to log db
    if(!done && data.RawData  && task.LogPriority){
      done = true;
      // ToDo
    }

    if(!done){
      log.warn({warn:true},
               "no eval branch for data found");
    }

  }else{
    log.error({error:"format"},
              "data is not an object")
  }
};
