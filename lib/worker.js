/**
 * Die ```worker``` arbeiten die ```tasks``` ab.
 *
 * Die taskks sind von der Funktion
 * ```run()``` schon auf object getestet.
 *
 * @author wactbprot (thsteinbock@web.de)
 */
var _        = require("underscore"),
    http     = require("http"),
    defaults = require("./defaults");


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
//
//  var path = "/" + prog.id + "/"+ prog.path,
//
//   con = {
//    hostname: prog.server ? prog.server : "localhost",
//    port:     prog.port   ? prog.port     : 8001,
//    path:     path,
//    method:   'GET',
//    headers: { 'Content-Type': 'application/json' }
//  };
//
//req = http.request(con, function(res) {
//
//              res.setEncoding("utf8");
//              res.on("data",function (data) {
//
//                var out = JSON.stringify(JSON.parse(data), null, 4)
//                process.stdout.write(out);
//              });
//              res.on("end", function(){
//
//              });
//              res.on("error", function(e){
//                process.stderr.write(e)
//              });
//            });
//
//  req.on("error", function(e) {
//    process.stderr.write("http error " + e.message);
//  });
//
//  utils.httpreq(con).end();
//
//
//
}


exports.VXI11 = noderelay;
exports.TCP   = noderelay;
exports.wait  = wait;
