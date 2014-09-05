var _        = require("underscore"),
    bunyan   = require("bunyan"),
    net      = require("./net"),
    request  = require("./request"),
    deflt    = require("./default"),
    utils    = require("./utils"),
    log      = bunyan.createLogger({name: deflt.appname});

/**
 * Die ```receive()``` Function ist die
 * Standard-Callbackfunktion für Netzwerkaufrufe
 * wie  ```noderelay()``` oder ```getList()```.
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
 * oder
 * ```
 * if(task.DocPath) ...
 * ```
 *
 * ```task.ExchangePath``` erledigt die  Fälle
 * in denen kein  ```PostProcessing``` zur Verfügung steht
 * aber trotzdem Daten nach ```Exchange```
 * geschrieben werden sollen.
 *
 * @param {Object} mp Messprog.-Objekt
 * @param {Object} task Task-Objekt
 * @param {Array} pfad Pfad Array
 * @param {Function} cb Callback Funktion
 */

module.exports = function(mp, task, path, inpdata, passdata, cb){
  // inpdata muss schon object (kein json sein)
  var done        = false,
      docpath     = task.DocPath,
      taskexpath  = task.ExchangePath,
      inpres, inptoex,inpid;

  if(_.isObject(inpdata)){
    inpres  = inpdata.Result;
    inptoex = inpdata.ToExchange;
    inpid   = inpdata._id;
  }else{
    inpres  = false;
    inptoex = false;
    inpid   = false;
  }

  // --*-- DocPath + ToExchange --*--
  if(!done && docpath && (docpath !== "") &&
     inpdata  && inptoex){

    done = true;
    log.info({ok:true},
             "found DocPath and ToExchange, try to save");
    utils.query_cd(mp, task, inpdata, function(res){
      if(res == "ok"){
        utils.write_to_exchange(mp, task, inpdata, cb);
      }else{
        cb("error");
      }
    })
  }
  // --*-- Couchdb document --*--
  if(!done &&
     inpdata  && inpid &&
     passdata && docpath){

    var wrtcon = net.wrtdoc(mp, inpid);

    //data_to_doc(doc, docpath, dataset,
    utils.data_to_doc(inpdata, docpath, passdata, function(filled_doc){
      request(mp,  task, path, wrtcon, filled_doc, false, cb)
    });
  }

  // --*-- DocPath --*--
  if(!done &&
     docpath  && (docpath !== "") &&
     inpdata  && inpres){

    done = true;
    log.info({ok:true},
             "found DocPath and Results try to save");
    utils.query_cd(mp, task, path, inpdata, cb)
  }

  // --*-- ToExchange --*--
  if(!done && inptoex){
    done = true;
    log.info({ok:true},
             "found ToExchange, try to exchange");
    utils.write_to_exchange(mp, task, inpdata, cb)
  }

  // --*-- ExchangePath --*--
  if(! done && taskexpath){
    done = true;
    log.info({ok:true},
             "found DocPath, try to save");
    utils.write_to_exchange(mp, task, inpdata, cb)

  }

  // --- write inpdata to log db
  if(!done && inpdata.RawData  && task.LogPriority){
    done = true;
    // ToDo
  }

  if(!done){
    log.warn({warn:true},
             "no eval branch for data found");
  }
};
