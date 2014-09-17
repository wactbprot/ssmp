var _        = require("underscore"),
    bunyan   = require("bunyan"),
    net      = require("./net"),
    request  = require("./request"),
    build    = require("./build"),
    deflt    = require("./default"),
    utils    = require("./utils"),
    ctrlstr  = deflt.ctrlStr,
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
 * z.B:
 * ```
 * if(data.ToExchange) ...
 * ```
 * Ein Bsp. hierfür wäre der  ```getList()``` worker
 *
 * oder
 *
 * 2.) anhand es wird anhand der Task entschieden:
 * z.B.:
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
  var ro,
      done        = false,
      docpath     = task.DocPath,
      taskexpath  = task.ExchangePath,
      inpres, inptoex, inpcalib, inpok, inperr, inptask, inpdocinf, inpmp;

  if(_.isObject(inpdata)){
    inpres    = inpdata.Result;
    inptoex   = inpdata.ToExchange;
    inpcalib  = inpdata.Calibration;
    inpmp     = inpdata.Mp;
    inptask   = inpdata.TaskName;
    inpok     = inpdata.ok;
    inperr    = inpdata.error;
    inpdocinf = inpdata.DocInfo;
  }else{
    inptask   = false;
    inpres    = false;
    inptoex   = false;
    inpcalib  = false;
    inpok     = false;
    inpmp     = false;
    inpdocinf = false;
    inperr    = false;
  }

  // --*-- DocPath + ToExchange --*--
  if(!done && docpath && (docpath !== "") &&
     inpdata  && inptoex){

    done = true;
    log.info({ok:true},
             "found DocPath and ToExchange, try to save");
    utils.query_cd(mp, task, path, inpdata, function(res){
      if(res.ok){
        log.info({ok:true},
                 "try to write to exchange");
        utils.write_to_exchange(mp, task, inpdata, cb);
      }else{
        ro = {error:"in call back of query_cd"}
        log.error(ro,
                 "try to write to exchange");
        cb(ro);
      }
    })
  }

  // --*-- Calibration document with pass data --*--
  if(!done &&
     inpdata  && inpcalib &&
     passdata && docpath && (docpath !== "")){

    done = true;
    log.info({ok:true},
             "found DocPath, PassData and doc._id");
    var wrtcon = net.wrtdoc(mp, inpdata._id)
    utils.data_to_doc(inpdata, docpath, passdata, function(filled_doc){
      var wrtdata = JSON.stringify(filled_doc);
      request.exec(mp,  task, path, wrtcon, wrtdata, false, cb);
    }) ;
  }

  // --*-- Calibration document without pass data --*--
  if(!done &&
     inpdata  && inpcalib && ! passdata){

    done = true;
    log.info({ok:true},
             "receive doc._id with no pass data: exec cb with indata");
     cb(inpdata);
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

  // --*-- wrote doc to database --*--
  if(!done && inpok){
    done = true;
    log.info(inpdata,
             "doc written to database");
    cb(inpdata);
  }

  // --*-- wrote doc to database --*--
  if(!done && inperr){
    done = true;
    log.error(inpdata,
             "something went wrong");
    cb(inpdata);
  }

  // --*-- receive Mp definition --*--
  if(!done && inpmp){
    done = true;
    log.info(inpdata,
             "receive mp definmition from data base");
    build(mp, inpdata, cb);
  }

  // --*-- receive Task --*--
  if(!done && inptask){
    done = true;

    mp.recipe.set(path, inpdata, function(){
      mp.state.set(path, ctrlstr.exec, function(){
        log.info(task, "loaded and replaced")
      });
    });
  }

  // --*-- receive DocInfo --*--
  if(!done && inpdocinf){
    done = true;
    var id = passdata;
    log.info(inpdata,
             "receive doc info data, try to store under mpid/id/" + id);

    mp.id.set([id], inpdata, cb)
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
