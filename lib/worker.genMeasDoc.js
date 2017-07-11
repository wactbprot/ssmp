/**
 * @module work.genMeasDoc
 */
var _        = require("underscore")
  , bunyan   = require("bunyan")
  , broker   = require("sc-broker")
  , net      = require("./net")
  , request  = require("./request")
  , conf     = require("./conf")
  , utils    = require("./utils")
  , log      = bunyan.createLogger({name: conf.app.name + ".worker.genMeasDoc",
                                    streams: conf.log.streams
                                   })
  , mem      = broker.createClient({port: conf.mem.port})

  , ro       = {ok: true}
  , err;


/**
 * ```wait()``` verzögert den Ablauf um die unter
 * ```task.WaitTime``` angegebene Zeit in ms.
 * Defaultwert ist eien Wartezeit von 1000ms
 * @method wait
 * @param {Object} task Task-Objekt
 * @param {Function} cb Callback Funktion
 */
module.exports = function(task, cb){
  var path    = task.Path
    , mdoc    = task.Value
    , wrtdata = JSON.stringify(mdoc);

  net.wrtdoc(mdoc._id, function(err, con){
    request.exec(con, task, wrtdata, function (err, data){
      if(err){
        log.error(err
                 , "received error in callback");
        cb(err);
      } else {
        var val = { id:   path[0]
                  , cdid: mdoc._id}

        log.info(ro,
                 "generated measurement doc:" + JSON.stringify(data));
        mem.publish("get_cd", val, function(err){
          if(!err){
            log.trace(ro
                     , "published to get_cd channel");
            if(_.isFunction(cb)){
              cb(null, ro)
            }
          }else{
            log.error(err
                     , "error on attempt to publish to get_cd channel");
            if(_.isFunction(cb)){
              cb(err)
            }
          }
        });
      }
    });
  });
};
