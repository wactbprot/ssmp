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
 * @method exec
 * @param {Object} con Verbindungs-Objekt
 * @param {Object} task Task-Objekt
 * @param {String} wrtdata i.a. json-string
 * @param {Function} cb Callback Funktion
 */
var exec = function(con, task, wrtdata, cb){

  var req = http.request(con, function(res) {
              res.setEncoding("utf8");
              var strdata = "";

              res.on("data", function (d) {
                strdata = strdata + d
              });
              res.on("end", function(){
                log.info({ok:true}
                        , "end of request, try to parse data")

                var data = JSON.parse(strdata);
                if(data.error){
                  if(task && _.isObject(task.Fallback)){
                    log.warn({warn: "use fallback"}
                            ,"fallback used for task: "
                            + task.TaskName );
                    cb(task.Fallback);
                  }else{
                    log.error({error: data.error}
                             ,"no fallback for task: " + task.TaskName );
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
                if(task && _.isObject(task.Fallback)){
                  log.warn({warn: "use fallback"}
                          , "fallback used" );
                  cb(task.Fallback);
                }else{
                  cb({error:e});
                }
              });
            });

  req.on("error", function(e) {
    log.error({error:e}
             ,"request failed")

    if(task && _.isObject(task.Fallback)){
      log.warn({warn: "use fallback"}
              ,"fallback used" );
      cb(task.Fallback);
    }else{
      cb({error:"receive error on request"});
    }
  });

  if(wrtdata){
    log.info({ok: true},
             "write data");
    req.write(wrtdata);
  }
  req.end();

  log.info({ok: true},
           "call request");

};
exports.exec = exec;
