var _        = require("underscore"),
    bunyan   = require("bunyan"),
    http     = require("http"),
    receive  = require("./receive"),
    deflt    = require("./default"),
    log      = bunyan.createLogger({name: deflt.appname}),
    ctrlstr  = deflt.ctrlStr;

/**
 * Generische http request Funktion.
 * Eine erfolgreiche Antwort (```data```)
 * wird der Funktion ```receive()``` übergeben.
 *
 * Fehler werden je nach ```onerror```-Einstellung
 * des Containers ( = ```_.first(path)```) behandelt.
 *
 *
 * @param {Object} mp Messprog.-Objekt
 * @param {Object} task Task-Objekt
 * @param {Array} pfad Pfad Array
 * @param {Object} con Verbindungs-Objekt
 * @param {String} wrtdata i.a. json-string
 * @param {Function} cb Callback Funktion
 */
var request = function(mp,  task, path, con,  wrtdata, passdata, cb){

  if(task.Params){
    con.params = task.Params;
  }
  var onerror = mp.onerror.get([_.first(path)]),
      req     = http.request(con, function(res) {
                  res.setEncoding("utf8");
                  res.on("data", function (d) {
                    var data = JSON.parse(d);

                    if(data.error){
                      log.error({error: data.error},
                                "receive error from " + task.TaskName + " request");
                      if(onerror == "fallback" && _.isObject(task.Fallback)){
                        log.warn({warn: "use fallback"},
                                 "fallback used for task: " + task.TaskName );
                        receive(mp, task, path, task.Fallback, passdata,cb);
                      }
                      if(onerror == "error"){
                        cb("error");
                      }
                    }else{
                      log.info({ok: true},
                               "receive data from " + task.TaskName + " request");
                      receive(mp, task, path, data, passdata, cb);
                    }
                  });
                  res.on("end", function(){
                    log.info("end of " + task.TaskName + " request")
                  });
                  res.on("error", function(e){
                    log.error({error:e}, "response failed")
                    if(onerror == "fallback" && _.isObject(task.Fallback)){
                      log.warn({warn: "use fallback"},
                               "fallback used for task: " + task.TaskName );
                      receive(mp, task, path, task.Fallback, passdata, cb);
                    }
                    if(onerror == "error"){
                      cb("error");
                    }
                  });
                });

  req.on("error", function(e) {
    log.error({error:e}, "request failed")
    if(onerror == "fallback" && _.isObject(task.Fallback)){
      log.warn({warn: "use fallback"},
               "fallback used for task: " + task.TaskName );
      receive(mp, task, path, task.Fallback, passdata, cb);
    }
    if(onerror == "error"){
      cb("error");
    }
  });

  if(wrtdata){
    req.write(wrtdata);
  }
  req.end();
};
module.exports = request;