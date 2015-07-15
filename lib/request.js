var _        = require("underscore")
  , bunyan   = require("bunyan")
  , http     = require("http")
  , deflt    = require("./default")
  , log      = bunyan.createLogger({name: deflt.app.name})
  , ctrlstr  = deflt.ctrlStr
  , ok       = {ok:true}
  , err;

/**
 * Generische http request Funktion.
 * Bei erfolgreiche Antwort (```data```)
 * werden die Daten dem callback ```cb(err, data)``` übergeben.
 * @method exec
 * @param {Object} con Verbindungs-Objekt
 * @param {Object} task Task-Objekt
 * @param {String} wrtdata i.a. json-string
 * @param {Function} cb Callback Funktion
 */
var exec = function (con, task, wrtdata, cb){

  var req = http.request(con, function (res) {
              res.setEncoding("utf8");
              var strdata = "";

              res.on("data", function (d) {
                strdata = strdata + d
              });
              res.on("end", function (){
                log.info(ok
                        , "end of request, try to parse data");

                var data = JSON.parse(strdata);
                if(data.error){
                  if(task && _.isObject(task.Fallback)){
                    log.warn({warn: "use fallback"}
                            ,"fallback used for task: "
                            + task.TaskName );
                    cb(null, task.Fallback);
                  }else{
                    err = new Error( data.error);
                    log.error(err
                             ,"no fallback for task: " + task.TaskName );
                    cb(err, data);
                  }
                }else{
                  if(data.warn){
                    log.warn({warn: data.warn}
                            ,"warning on receiving data");
                  }else{
                    log.info(ok
                            ,"receive data from  request");
                  }
                  cb(null, data);
                }
              });

              res.on("error", function (err){
                log.error(err
                         ,"response failed");

                if(task && _.isObject(task.Fallback)){
                  log.warn({warn: "use fallback"}
                          , "fallback used" );
                  cb(err, task.Fallback);
                }else{
                  cb(err);
                }
              });
            });

  req.on("error", function (err) {
    log.error(err
             ,"request failed");

    if(task && _.isObject(task.Fallback)){
      log.warn({warn: "use fallback"}
              ,"fallback used" );
      cb(err, task.Fallback);
    }else{
      cb(err);
    }
  });

  if(wrtdata){
    log.info(ok,
             "write data");
    req.write(wrtdata);
  }
  req.end();

  log.info(ok,
           "call request");

};
exports.exec = exec;
