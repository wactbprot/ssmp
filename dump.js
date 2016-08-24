/**
 * mp dump.
 */
module.exports = function(cb){
  var _        = require("underscore")
    , conf     = require("./lib/conf")
    , dumpdb   = conf.dumpdb
    , http     = require("http")
    , dd       = new Date()
    , mpstr = ""
    , dumpopt = {
      hostname: dumpdb.server,
      port: dumpdb.port,
      path: "/" + dumpdb.name + "/" + dd.toISOString().replace(/[T:.]/g, "_"),
      headers: {"content-type": "application/json"},
      method: 'PUT'
    }
    , getopt = {
      hostname: "localhost",
      port: 8001,
      path: "/dump",
      headers: {"content-type": "application/json"},
      method: 'GET'
    }
  var getcb = function(response) {

    response.on('data', function (chunk) {
      mpstr += chunk;
    });

    response.on('end', function () {
      var dumpreq = http.request(dumpopt, function(res){

                    });

      dumpreq.on('error', function(e){
        console.log("error on attempt to write dump to data base");
      });

      dumpreq.write(mpstr, function(){
        console.log("wrote  dump to data base");
      });

      dumpreq.end();

    });
  }

  var req = http.request(getopt, getcb).end();


}