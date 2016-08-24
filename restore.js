/**
 * mp restore.
 */
module.exports = function(cb){
  var _        = require("underscore")
    , proc     = require('child_process')
    , http     = require("http")
    , prog     = require("commander")
    , conf     = require("./lib/conf")
    , info     = require("./package.json")
    , dumpdb   = conf.dumpdb
    , dd       = new Date()
    , mpstr = ""
    , getopt = {
      hostname: dumpdb.server,
      port: dumpdb.port,
      path: "/" + dumpdb.name + "/",
      headers: {"content-type": "application/json"},
      method: 'GET'
    }
    , restoreopt = {
      hostname: "localhost",
      port: 8001,
      path: "/dump",
      headers: {"content-type": "application/json"},
      method: 'PUT'
    }
  prog.version(info.version)
  .option("-d, --doc <id>", "database id of the dump document")
  .option("-l, --list ", "list dump document")
  .parse(process.argv);

  if(prog.list){

    var getcb = function(response) {
      response.on('data', function (chunk) {
        mpstr += chunk;
      });

      response.on('end', function () {
        console.log("\nAvailable dumps:\n");
        var  res = JSON.parse(mpstr).rows
        for (var i = 0; i < res.length; i++){
          console.log(res[i].id +  "  (url: http://"+ getopt.hostname + ":" +getopt.port + getopt.path +"/"+res[i].id +")");
        }
        console.log("\n");
      });
    }
    getopt.path = getopt.path +"_all_docs";

    var req = http.request(getopt, getcb).end();

  }else{
    if(prog.doc){
      getopt.path = getopt.path + prog.doc;
      var getcb = function(response) {

      response.on('data', function (chunk) {
        mpstr += chunk;
      });

      response.on('end', function () {
        var restorereq = http.request(restoreopt, function(res){
                           console.log("restore dump" );
                         });

        restorereq.on('error', function(e){
          console.log("error on attempt to write restore to data base: " + e.message);
        });

        restorereq.write(mpstr, function(){
          console.log("wrote restore to ssmp");
        });
        
        restorereq.end();
      });
      }
      var req = http.request(getopt, getcb).end();
    }
  }
}