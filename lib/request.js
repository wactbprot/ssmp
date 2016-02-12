/**
 * Handles all the network requests
 *
 * @module request
 */
var _        = require("underscore")
  , bunyan   = require("bunyan")
  , logStrm  = require("bunyan-couchdb-stream")
  , http     = require("http")
  , conf     = require("./conf")
  , utils    = require("./utils")
  , ok       = {ok:true}, err
  , ctrlstr  = conf.ctrlStr
  , log      = bunyan.createLogger({name: conf.app.name + ".request",
                                    streams: conf.log.streams
                                   });


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
  log.trace(ok
          , "call to request.exec");

  var req_cb = function (res) {

    res.setEncoding("utf8");
    var strdata = "";
    log.trace(ok
            , "connected with: " + task.TaskName);
    // response on data
    res.on("data", function (d) {
      log.trace(ok
              , "receive data");
      strdata = strdata + d;
    });

    // response on end
    res.on("end",function (){
      log.trace(ok
              , "end of request for task: "
              + task.TaskName
              + ", try to parse data");

      var data = JSON.parse(strdata);
      if(data._id){
        log.debug({ok:true
                  , id: data._id
                  , rev: data._rev});
      }else{
        if(task && !task.NoLog && !data.TaskName){
          log.debug({readdata: data,
                     connection :con,
                     taskname:task.TaskName}
                   , "response with data");
        }
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
          log.trace(ok
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
        log.trace(ok
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
