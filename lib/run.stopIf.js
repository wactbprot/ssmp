var _        = require("underscore")
  , bunyan   = require("bunyan")
  , logStrm  = require("bunyan-couchdb-stream")
  , ndata    = require('ndata')
  , deflt    = require("./default")
  , cstr     = deflt.ctrlStr
  , ro       = {ok:true}
  , err
  , utils    = require("./utils")
  , log = bunyan.createLogger({name: deflt.app.name + ".run.stopIf",
                               streams: utils.log_streams
                              })
  , mem      = ndata.createClient({port: deflt.mem.port})


/**
 * Entscheidet ob Task abgearbeitet ist
 * @method stop_if
 * @param {Array} path
 * @param {Object} task
 * @param {Boolean} ok
 * @param {String} cmdstr
 * @param {Function} cb
 */
module.exports = function (path, task, ok, cmdstr, cb){
  var tsknm = task.TaskName
  if(task.StopIf){
    var path_s = task.StopIf.split(".");

    mem.get(path.concat(path_s), function (err, value){
      if(!err){
        if(value ==  true || value == "true"){
          ok     = false;
          cmdstr = cstr.exec;
        }else{
          ok     = true && ok;
          cmdstr = cstr.ready;
        }
      }else{
        log.warn(err
                , "can not read exchange at "
                + task.StopIf);
      }
      cb(task, ok, cmdstr);
    }); // get stop if state
  }else{ // StopIf
    cb(task, ok, cmdstr);
  }
}
