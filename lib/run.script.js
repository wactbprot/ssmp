/**
 * @module run.script
 */
var _        = require("underscore")
  , bunyan   = require("bunyan")
  , logStrm  = require("bunyan-couchdb-stream")
  , broker   = require("sc-broker")
  , conf     = require("./conf")
  , utils    = require("./utils")
  , cstr     = conf.ctrlStr
  , ro       = {ok:true} , err
  , log      = bunyan.createLogger({name: conf.app.name + ".run.script",
                                    streams: conf.log.streams
                                   })
  , mem      = broker.createClient({port: conf.mem.port});

/**
 * Arbeitet Script-Key ab und setzt bzw. ersetzt
 * das Ergebnis in der aktuellen Task.
 *
 * Das Script
 * soll ein object zurückgeben, mit dessen keys
 * das Task-object erweitert wird.
 * 
 * @method script
 * @param {Array} path
 * @param {Object} task
 * @param {Boolean} ok
 * @param {String} cmdstr
 * @param {Function} cb
 */
module.exports = function (path, task, ok, cmdstr, cb){
  var tsknm = task.TaskName
    , scrpt
    , retobj
  if(task.Script){

    if( _.isArray(task.Script)) {
      scrpt = task.Script.join("")
    }

    if( _.isString(task.Script)) {
      scrpt = task.Script
    }
    if(scrpt) {
      try {
       retobj =  eval(scrpt);
      } catch (e) {
        if (e) {
          log.error(e, "on attempt to eval Script");
        }
      }
      if(retobj && _.isObject(retobj)){
        for(var k in retobj){
          task[k] = retobj[k];
        }
      } else{
        log.error("Task.Script don't return an object");
      }

    }else{
      log.error("Task.Script is neither a Array nor a String");
    }
    cb(task, ok, cmdstr);
  }else{ // Script
    cb(task, ok, cmdstr);
  }
}
