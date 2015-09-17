var _        = require("underscore")
  , bunyan   = require("bunyan")
  , logStrm  = require("bunyan-couchdb-stream")
  , http     = require("http")
  , deflt    = require("./default")
  , utils    = require("./utils")
  , log = bunyan.createLogger({name: deflt.app.name + ".request",
                               streams: [
                                 {
                                   stream: new logStrm(utils.logurl),
                                   level: 'debug',
                                   type: 'raw'
                                 },{
                                   level: 'info',
                                   stream: process.stdout
                                 }
                               ]
                              })
  , ctrlstr  = deflt.ctrlStr
  , ok       = {ok:true}
  , err
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

  log.info(ok
          , "call to request.exec");

  var req_cb = function (res) {

    res.setEncoding("utf8");
    var strdata = "";
    log.info(ok
            , "connected with: " + task.TaskName);
    // response on data
    res.on("data", function (d) {
      log.info(ok
              , "receive data");
      strdata = strdata + d;
    });

    // response on end
    res.on("end",function (){
      log.info(ok
              , "end of request for task: "
              + task.TaskName
              + ", try to parse data");

      var data = JSON.parse(strdata);
      if(data._id){
        log.debug({readdata:"document: "
                           + data._id
                           + " revision: "
                           + data._rev,
                   connection :con,
                   task:task}
                 , "response is a document");
      }else{
        log.debug({readdata: data,
                   connection :con,
                   task:task}
                 , "response with data");
      }

      if(data.error){
        if(task && _.isObject(task.Fallback)){
          log.warn({warn: "use fallback"}
                  ,"fallback used for task: "
                  + task.TaskName );
          cb(null, task.Fallback);
        }else{
          err = new Error(data.error);
          log.error(err
                   ,"data error; no fallback for task: "
                   + task.TaskName );
          cb(err);
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

    // response on error
    res.on("error", res_err);
  }

  // response error
  var res_err = function (err){
    log.error(err
             ,"response failed");

    if(task && _.isObject(task.Fallback)){
      log.warn({warn: "use fallback"}
              , "fallback used" );
      cb(null, task.Fallback);
    }else{
      log.error(err
               ,"response error; no fallback for task: "
               + task.TaskName );
      cb(err);
    }
  }

  // request error
  var req_err = function (err) {
    log.error(err
             ,"request failed");
    if(task && _.isObject(task.Fallback)){
      log.warn({warn: "use fallback"}
              ,"fallback used" );
      cb(null, task.Fallback);
    }else{
      log.error(err
               ,"request error; no fallback for task: "
               + task.TaskName );
      cb(err);
    }
  }

  // generating request
  var req = http.request(con, req_cb);

  // request on error
  if(wrtdata){
    if(_.isString(wrtdata)){

      req.write(wrtdata, function(){
        var data = JSON.parse(wrtdata);
        if(data._id){
          log.debug({writedata:"document: "
                              + data._id
                              + " revision: "
                              + data._rev,
                     connection :con}
                   , "request data after reparsing to json");
        }else{
          log.debug({writedata:data,
                     connection :con}
                   , "request data after reparsing to json");

        }
        log.info(ok
                , "write data for: " + task.TaskName);
      });
    }else{
      err = new Error("wrong write data");
      log.error(err
               ,"data to write is not a string");
      cb(err);
    }
  }

  // request error
  req.on("error", req_err);

  // request end
  req.end();

};
exports.exec = exec;
