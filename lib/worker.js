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
    defaults = require("./defaults"),
    net      = require("./net"),
    log      = bunyan.createLogger({name: defaults.appname});


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

  var dr  = defaults.relay,
      con = {
        hostname: dr.server,
        port:     dr.port,
        method:   "POST",
        headers: { 'Content-Type': 'application/json' }
      };

  var req =  net.relayreq(con, function(data){
                            console.log(data)
                          },
                          cb);

  req.write(JSON.stringify(task));
  req.end();
}


exports.VXI11 = noderelay;
exports.TCP   = noderelay;
exports.wait  = wait;
