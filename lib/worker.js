/**
 * Die ```worker``` arbeiten die ```tasks``` ab.
 *
 * Die taskks sind von der Funktion
 * ```run()``` schon auf object getestet.
 *
 * @author wactbprot (thsteinbock@web.de)
 */
var _        = require("underscore"),
    bunyan   = require("bunyan"),
    http     = require("http"),
    defaults = require("./defaults"),
    net      = require("./net"),
    receive  = require("./receive"),
    log      = bunyan.createLogger({name: defaults.appname});


var wait = function(mp, task, cb){
  if(task.Value          &&
     task.Value.WaitTime){

    setTimeout(function(){
      cb("ok");
    }, parseInt(task.Value.WaitTime,10))
  }else{
    cb("error")
  }
};

var noderelay = function(mp, task, cb){

  var con = net.relay(mp),
      req = http.request(con, function(res) {
              res.setEncoding("utf8");
              res.on("data", function (data) {
                receive(mp, task, data);
                log.info({ok:true}, "receive data from " + task.TaskName + " request")
              });
              res.on("end", function(){
                cb("ok");
                log.info({ok:true}, "ready with " + task.TaskName)
              });
              res.on("error", function(e){
                cb("error");
                log.error({error:e}, "response failed")
              });
            });

  req.on("error", function(e) {
    cb("error");
    log.error({error:e}, "request failed")
  });

  req.write(JSON.stringify(task));
  req.end();
}


exports.VXI11 = noderelay;
exports.TCP   = noderelay;
exports.wait  = wait;
