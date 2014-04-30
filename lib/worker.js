/**
 *
 * Die ```worker``` arbeiten die ```tasks``` ab.
 *
 * @author wactbprot (thsteinbock@web.de)
 */
var _   = require("underscore");

/**
 * Auch hier zunächst ein demo worker,
 * nach dessen Muster alle Weiteren
 * funktionieren sollten
 *
 *
 * @param pos Object die Position der Task im Rezept
 * @param cbfn die callback-Funktion
 */

var demoWorker = function(task, callback){

    //-----------------//
    // place code here //
    //---------------- //
  
};
exports.demoWorker = demoWorker;

var wait = function(task, callback){

  if(_.isObject(task)    &&
     task.Value          &&
     task.Value.WaitTime){

    setTimeout(function(){
      callback("ok");
    }, parseInt(task.Value.WaitTime,10))
  }else{
    callback("error")
  }
};
exports.wait = wait;