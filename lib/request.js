var _        = require("underscore"),
    bunyan   = require("bunyan"),
    http     = require("http"),
    deflt    = require("./default"),
    log      = bunyan.createLogger({name: deflt.appname}),
    ctrlstr  = deflt.ctrlStr;

/**
 * Generische http request Funktion.
 * Bei erfolgreiche Antwort (```data```)
 * werden die Daten dem callback ```cb(data)``` übergeben.
 *
 * Fehler werden je nach ```OnError```-Einstellung
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

var exec = function(mp, con, task, path, wrtdata, cb){
  var onerror;
  log.info({ok: true, path: con.path},
           "call request");
  if(mp && mp.onerror){
    onerror = mp.onerror.get([_.first(path)]);
  }else{
    onerror = "error";
  }

  var req     = http.request(con, function(res) {
                  res.setEncoding("utf8");
                  var strdata = "";

                  res.on("data", function (d) {
                    strdata = strdata + d
                  });
                  res.on("end", function(){
                    log.info({ok:true},"end of request, try to parse data")
                    var data = JSON.parse(strdata);
                    if(data.error){
                      log.error({error: data.error}
                               ,"receive error in request.js");

                      if(onerror == "fallback" &&
                         task                  &&
                         _.isObject(task.Fallback)){
                        log.warn({warn: "use fallback"}
                                ,"fallback used for task: " + task.TaskName );
                        cb(task.TaskName);
                      }
                      if(onerror == "error"){
                        cb(data);
                      }
                    }else{
                      if(data.warn){
                        log.warn({warn: data.warn}
                                 ,"warning on receiving data");
                      }else{
                        log.info({ok: true}
                                 ,"receive data from  request");
                      }
                      cb(data);
                    }
                  });
                  res.on("error", function(e){
                    log.error({error:e}
                             ,"response failed")
                    if(onerror == "fallback" &&
                       task                  &&
                       _.isObject(task.Fallback)){
                      log.warn({warn: "use fallback"}
                              , "fallback used" );
                      cb(task.Fallback);
                    }
                    if(onerror == "error"){
                      cb("error");
                    }
                  });
                });

  req.on("error", function(e) {
    log.error({error:e}
             ,"request failed")

    if(onerror == "fallback" &&
       task                  &&
       _.isObject(task.Fallback)){
      log.warn({warn: "use fallback"}
              ,"fallback used" );
      cb(task.Fallback);
    }
    if(onerror == "error"){
      cb({error:"receive error on request"});
    }
  });

  if(wrtdata){
    log.info({ok: true},
             "write data");
    req.write(wrtdata);
  }
  req.end();
};
exports.exec = exec;
