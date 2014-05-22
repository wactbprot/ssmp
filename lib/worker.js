/**
 * Die ```worker``` arbeiten die ```tasks``` ab.
 *
 * Die taskks sind von der Funktion
 * ```run()``` schon auf object getestet.
 *
 * @author wactbprot (thsteinbock@web.de)
 */
var _  = require("underscore");

var wait = function(task, cb){
  if(task.Value          &&
     task.Value.WaitTime){

    setTimeout(function(){
      cb("ok");
    }, parseInt(task.Value.WaitTime,10))
  }else{
    cb("error")
  }
};


var noderelay = function(task, cb){
  console.log("---------------------------")
  console.log(task)
  console.log("---------------------------")
}


exports.VXI11 = noderelay;
exports.TCP   = noderelay;
exports.wait  = wait;
