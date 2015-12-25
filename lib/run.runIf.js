var _        = require("underscore")
  , bunyan   = require("bunyan")
  , logStrm  = require("bunyan-couchdb-stream")
  , ndata    = require('ndata')
  , conf     = require("./conf")
  , utils    = require("./utils")
  , log      = bunyan.createLogger({name: conf.app.name + ".run.runIf",
                                    streams: conf.log.streams
                                   })
  , cstr     = conf.ctrlStr
  , ro       = {ok:true}
  , err
  , mem      = ndata.createClient({port: conf.mem.port})

/**
 * Entscheidet ob Task gestartet wird
 * @method run_if
 * @param {Array} path
 * @param {Object} task
 * @param {Boolean} ok
 * @param {String} cmdstr
 * @param {Function} cb
 */
module.exports = function (path, task, ok, cmdstr, cb){
  var tsknm = task.TaskName
  // --- RunIf
  if(task.RunIf){
    var path_r = task.RunIf.split(".");
    mem.get(path.concat(path_r), function (err, value){
      if(!err){
        if(value ==  true || value == "true"){
          ok     = true && ok;
	  cmdstr = cstr.exec;
        }else{
          ok     = false;
	  cmdstr = cstr.ready;
        }
      }else{
        log.error(err
                 , "can not read exchange at "
                 + task.RunIf);
      }
      cb(task, ok, cmdstr);
    }); // get run if state
  }else{ // RunIf
    cb(task, ok, cmdstr);
  }
}
