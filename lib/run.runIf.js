var _        = require("underscore")
  , bunyan   = require("bunyan")
  , logStrm  = require("bunyan-couchdb-stream")
  , ndata    = require('ndata')
  , deflt    = require("./default")
  , utils    = require("./utils")
  , log = bunyan.createLogger({name: deflt.app.name + ".run.runIf",
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

  , cstr     = deflt.ctrlStr
  , ro       = {ok:true}
  , err
  , mem      = ndata.createClient({port: deflt.mem.port})

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
