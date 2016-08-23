/**
 * The db maker.
 */
module.exports = function(cb){
  var _        = require("underscore")
    , conf     = require("./lib/conf")
    , logdb    = conf.logdb
    , datdb    = conf.database
    , http     = require("http")
    , logopt = {
      hostname: logdb.server,
      port: logdb.port,
      path: "/" +  logdb.name,
      headers: {"content-type": "application/json"},
      method: 'PUT'
    }
    , datopt = {
      hostname: datdb.server,
      port: datdb.port,
      path: "/" +  datdb.name,
      headers: {"content-type": "application/json"},
      method: 'PUT'
    }
    , replopt = {
      hostname: datdb.server,
      port: datdb.port,
      path: "/_replicate",
      headers: {"content-type": "application/json"},
      method: 'POST'
    }
    , repldat = JSON.stringify(
      {"source":"vl_db", "target": datdb.name, "continuous": true}
    );

  var logreq = http.request(logopt, function(res){
                 console.log("---------------------------------------------");
                 console.log("create log database: " +  logdb.name + "@" + logdb.server );
                 console.log("..............................................");
                 var datreq = http.request(datopt, function(res){
                                console.log("---------------------------------------------");
                                console.log("create work database: " +  datdb.name + "@" + datdb.server );
                                console.log("..............................................");

                                var replreq = http.request(replopt, function(res){
                                                console.log("---------------------------------------------");
                                                console.log("replicate vl_db to work database");
                                                console.log("..............................................");
                                              });

                                replreq.on('error', function(e){
                                  console.log("error on attempt to replicate database");
                                });
                                replreq.write(repldat, function(){
                                  cb();
                                });
                                replreq.end();
                              });

                 datreq.on('error', function(e){
                   console.log("error on attempt to create work database");
                 });

                 datreq.end();
               });

  logreq.on('error', function(e){
    console.log("error on attempt to create log database");
  });

  logreq.end();
}